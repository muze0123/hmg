package com.metritag.hmg;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:platformtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PlatformIntegrationTest {
 @Autowired MockMvc mvc;
 @Autowired ObjectMapper json;
 @Autowired JdbcTemplate jdbc;
 String auth(String user) { return "Basic " + Base64.getEncoder().encodeToString((user+":development-only").getBytes(StandardCharsets.UTF_8)); }
 JsonNode send(String path, String body, String user) throws Exception {
  return json.readTree(mvc.perform(post(path).header("Authorization",auth(user)).contentType(MediaType.APPLICATION_JSON).content(body))
   .andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString());
 }
 String dispatch(String eventId, String sourceTaskId) throws Exception {
  String body="{\"eventId\":\""+eventId+"\",\"sourceTaskId\":\""+sourceTaskId+"\",\"sourceRevision\":\"1\",\"tenantId\":\"a\",\"name\":\"Dispatched task\",\"workflowDefinitionVersion\":\"wf-v1\",\"ownerId\":\"a.executor\"}";
  return send("/api/v1/platform/task-dispatches",body,"a.executor").get("businessId").asText();
 }

 @Test void dispatchIsIdempotentAndTenantScoped() throws Exception {
  String event="evt-"+UUID.randomUUID(), source="src-"+UUID.randomUUID();
  String id=dispatch(event,source);
  var again=send("/api/v1/platform/task-dispatches",
   "{\"eventId\":\""+event+"\",\"sourceTaskId\":\""+source+"\",\"sourceRevision\":\"1\",\"tenantId\":\"a\",\"name\":\"Dispatched task\",\"workflowDefinitionVersion\":\"wf-v1\",\"ownerId\":\"a.executor\"}","a.executor");
  assertThat(again.get("status").asText()).isEqualTo("DUPLICATE");
  assertThat(again.get("businessId").asText()).isEqualTo(id);
  mvc.perform(post("/api/v1/platform/task-dispatches").header("Authorization",auth("b.executor")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"eventId\":\""+event+"\",\"sourceTaskId\":\""+source+"\",\"sourceRevision\":\"1\",\"tenantId\":\"b\",\"name\":\"X\",\"workflowDefinitionVersion\":\"wf-v1\",\"ownerId\":\"b.executor\"}"))
   .andExpect(status().isCreated()); // b has its own tenant-scoped copy
  mvc.perform(get("/api/v1/tasks/"+id).header("Authorization",auth("b.executor"))).andExpect(status().isNotFound());
 }

 @Test void staleAndMatchingApprovalCallbacks() throws Exception {
  String id=dispatch("evt-"+UUID.randomUUID(),"src-"+UUID.randomUUID());
  // bind a workflow instance on the main node at configure, then add a section + subtask
  String child="{\"kind\":\"TECHNICAL\",\"executor\":\"a.executor\",\"reviewers\":[\"a.reviewer\"]}";
  JsonNode task=send("/api/v1/tasks/"+id+"/nodes/"+id+"/configure",
   "{\"version\":0,\"children\":["+child+"],\"vehicleId\":\"v1\",\"workflowInstanceId\":\"inst-1\",\"workflowRevision\":\"wf-v1\"}","a.executor");
  String section=task.at("/task/root/children/0/id").asText();
  // seed template before binding it to a section
  jdbc.update("MERGE INTO template_version (id,tenant_id,template_id,revision,published,schema_json) KEY(id) VALUES ('T-v1','a','T','1',TRUE,?)",
   "{\"templateId\":\"T\",\"revision\":\"1\",\"name\":\"Technical\",\"kind\":\"TECHNICAL\",\"regulationId\":\"R1\",\"fields\":[{\"id\":\"mass\",\"label\":\"Mass\",\"format\":\"NUMBER\",\"required\":true,\"minimum\":1}]}");
  task=send("/api/v1/tasks/"+id+"/nodes/"+section+"/configure",
   "{\"version\":"+task.get("version")+",\"children\":[{\"kind\":\"TECHNICAL\",\"regulationId\":\"R1\",\"templateVersionId\":\"T-v1\",\"executor\":\"a.executor\",\"reviewers\":[\"a.reviewer\"]}]}","a.executor");
  String sub=task.at("/task/root/children/0/children/0/id").asText();
  task=send("/api/v1/tasks/"+id+"/nodes/"+sub+"/actions/save","{\"version\":"+task.get("version")+",\"values\":{\"mass\":10}}","a.executor");
  task=send("/api/v1/tasks/"+id+"/nodes/"+sub+"/actions/submit","{\"version\":"+task.get("version")+"}","a.executor");
  task=send("/api/v1/tasks/"+id+"/nodes/"+sub+"/actions/approve","{\"version\":"+task.get("version")+"}","a.reviewer");
  // section auto-submitted when its last subtask is approved
  task=send("/api/v1/tasks/"+id+"/nodes/"+section+"/actions/approve","{\"version\":"+task.get("version")+"}","a.reviewer");
  // main auto-submitted with instance/revision/approvalId bound
  String approval=task.at("/task/root/approvalId").asText();
  assertThat(approval).isNotBlank();

  String stale="{\"eventId\":\"cb-stale-"+UUID.randomUUID()+"\",\"instanceId\":\"inst-1\",\"approvalId\":\"wrong\",\"businessId\":\""+id+"\",\"tenantId\":\"a\",\"actorId\":\"a.reviewer\",\"decision\":\"APPROVE\",\"workflowRevision\":\"wf-v1\",\"occurredAt\":\"2026-11-20T00:00:00Z\"}";
  assertThat(send("/api/v1/platform/approvals/callbacks",stale,"a.reviewer").get("status").asText()).isEqualTo("IGNORED");
  mvc.perform(get("/api/v1/tasks/"+id).header("Authorization",auth("a.executor")))
   .andExpect(jsonPath("$.task.root.state").value("REVIEWING"));

  String match="{\"eventId\":\"cb-ok-"+UUID.randomUUID()+"\",\"instanceId\":\"inst-1\",\"approvalId\":\""+approval+"\",\"businessId\":\""+id+"\",\"tenantId\":\"a\",\"actorId\":\"platform-user\",\"decision\":\"APPROVE\",\"workflowRevision\":\"wf-v1\",\"occurredAt\":\"2026-11-20T00:00:00Z\"}";
  assertThat(send("/api/v1/platform/approvals/callbacks",match,"a.reviewer").get("status").asText()).isEqualTo("APPLIED");
  mvc.perform(get("/api/v1/tasks/"+id).header("Authorization",auth("a.executor")))
   .andExpect(jsonPath("$.task.root.state").value("COMPLETED"));
  mvc.perform(get("/api/v1/tasks/"+id+"/status").header("Authorization",auth("a.executor")))
   .andExpect(status().isOk())
   .andExpect(jsonPath("$.status").value("completed"))
   .andExpect(jsonPath("$.nodes[0].kernelState").value("COMPLETED"))
   .andExpect(jsonPath("$.nodes[0].status").value("completed"));
  mvc.perform(get("/api/v1/tasks/"+id+"/status").header("Authorization",auth("b.executor")))
   .andExpect(status().isNotFound());
 }
}
