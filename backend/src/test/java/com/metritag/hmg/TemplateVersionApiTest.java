package com.metritag.hmg;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:templateversiontest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class TemplateVersionApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    String auth(String user) {
        return "Basic " + java.util.Base64.getEncoder().encodeToString((user+":development-only").getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
    ResultActions postBody(String path, Object body) throws Exception {
        return mvc.perform(post(path).header("Authorization",auth("a.executor")).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(body)));
    }
    JsonNode result(ResultActions action) throws Exception {
        return json.readTree(action.andReturn().getResponse().getContentAsString());
    }
    Map<String,Object> definition(String template, String revision, int minimum) {
        return Map.of("templateId",template,"revision",revision,"name","Technical parameters","kind","TECHNICAL","regulationId","R1",
            "fields",List.of(Map.of("id","mass","label","Mass","format","NUMBER","required",true,"minimum",minimum)));
    }
    JsonNode version(String template,String revision,int minimum) throws Exception {
        var response=postBody("/api/v1/template-versions",definition(template,revision,minimum));
        response.andExpect(status().isCreated());
        return result(response);
    }
    @Test void versionsAreTenantScopedImmutableAndUnique() throws Exception {
        String key=UUID.randomUUID().toString();
        JsonNode version=version(key,"1",0); String id=version.get("id").asText();
        postBody("/api/v1/template-versions",definition(key,"1",0)).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/template-versions/"+id).header("Authorization",auth("b.executor"))).andExpect(status().isNotFound());
        postBody("/api/v1/template-versions/"+id+"/publish",Map.of()).andExpect(status().isOk());
        postBody("/api/v1/template-versions/"+id+"/publish",Map.of()).andExpect(status().isOk());
        mvc.perform(put("/api/v1/template-versions/"+id).header("Authorization",auth("a.executor")).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(definition(key,"1",10)))).andExpect(status().isMethodNotAllowed());
    }
    @Test void bindingFreezesSchemaAndValidationErrorsDoNotAdvanceTask() throws Exception {
        String key=UUID.randomUUID().toString();
        JsonNode version=version(key,"1",0); String versionId=version.get("id").asText();
        JsonNode task=result(mvc.perform(post("/api/v1/tasks").header("Authorization",auth("a.executor")).header("Idempotency-Key",key)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(Map.of("name","Task","vehicleId","car","workflowVersion","workflow-1","reviewers",List.of("a.reviewer")))))
            .andExpect(status().isCreated()));
        String id=task.get("id").asText(); String prefix="/api/v1/tasks/"+id+"/nodes/";
        task=result(postBody(prefix+id+"/configure",Map.of("version",0,"children",List.of(Map.of("kind","TECHNICAL","executor","a.executor","reviewers",List.of("a.reviewer"))))).andExpect(status().isOk()));
        String section=task.at("/task/root/children/0/id").asText();
        Map<String,Object> configuration=Map.of("version",task.get("version").asLong(),"children",List.of(Map.of("kind","TECHNICAL","regulationId","R1","templateVersionId",versionId,"executor","a.executor","reviewers",List.of("a.reviewer"))));
        postBody(prefix+section+"/configure",configuration).andExpect(status().isConflict());
        postBody("/api/v1/template-versions/"+versionId+"/publish",Map.of()).andExpect(status().isOk());
        task=result(postBody(prefix+section+"/configure",configuration).andExpect(status().isOk()));
        String sub=task.at("/task/root/children/0/children/0/id").asText(); long revision=task.get("version").asLong();
        postBody(prefix+sub+"/actions/submit",Map.of("version",revision)).andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.errors[0].code").value("required"));
        postBody(prefix+sub+"/actions/save",Map.of("version",revision,"values",Map.of("mass",-1))).andExpect(status().isUnprocessableEntity());
        postBody(prefix+sub+"/actions/save",Map.of("version",revision,"values",Map.of("unknown",1))).andExpect(status().isUnprocessableEntity());
        JsonNode second=version(key,"2",100);
        postBody("/api/v1/template-versions/"+second.get("id").asText()+"/publish",Map.of()).andExpect(status().isOk());
        task=result(postBody(prefix+sub+"/actions/save",Map.of("version",revision,"values",Map.of("mass",0))).andExpect(status().isOk()));
        assertThat(task.at("/task/root/children/0/children/0/templateSnapshot/revision").asText()).isEqualTo("1");
        postBody(prefix+sub+"/actions/submit",Map.of("version",task.get("version").asLong())).andExpect(status().isOk());
    }
}
