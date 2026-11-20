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
import java.util.UUID;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:hmgtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class TaskApiTest {
 @Autowired MockMvc mvc;
 @Autowired ObjectMapper json;
 @Autowired JdbcTemplate jdbc;
 String auth(String user) { return "Basic " + java.util.Base64.getEncoder().encodeToString((user+":development-only").getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
 JsonNode send(String path, String body, String user) throws Exception {
  return json.readTree(mvc.perform(post(path).header("Authorization",auth(user)).contentType(MediaType.APPLICATION_JSON).content(body))
   .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
 }
 JsonNode create(String key) throws Exception {
  return json.readTree(mvc.perform(post("/api/v1/tasks").header("Authorization",auth("a.executor"))
   .header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON)
   .content("{\"name\":\"Task\",\"vehicleId\":\"vehicle-1\",\"workflowVersion\":\"workflow-v1\",\"reviewers\":[\"a.reviewer\"]}"))
   .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
 }
 @org.junit.jupiter.api.BeforeEach void templateFixture() throws Exception {
  if (jdbc.queryForObject("SELECT COUNT(*) FROM template_version WHERE id='T-v1'",Integer.class)==0) {
   String schema="{\"templateId\":\"T\",\"revision\":\"1\",\"name\":\"Technical\",\"kind\":\"TECHNICAL\",\"regulationId\":\"R1\",\"fields\":[{\"id\":\"mass\",\"label\":\"Mass\",\"format\":\"NUMBER\",\"required\":true,\"minimum\":1}]}";
   jdbc.update("INSERT INTO template_version(id,tenant_id,template_id,revision,published,schema_json) VALUES(?,?,?,?,?,?)","T-v1","a","T","1",true,schema);
  }
 }
 @Test void fullHierarchyIsTenantScopedLockedAndTransactional() throws Exception {
  String key=UUID.randomUUID().toString(); var task=create(key); String id=task.get("id").asText();
  assertThat(create(key).get("id").asText()).isEqualTo(id);
  mvc.perform(get("/api/v1/tasks/"+id).header("Authorization",auth("b.executor"))).andExpect(status().isNotFound());
  String prefix="/api/v1/tasks/"+id+"/nodes/";
  String child="{\"kind\":\"TECHNICAL\",\"executor\":\"a.executor\",\"reviewers\":[\"a.reviewer\"]}";
  task=send(prefix+id+"/configure","{\"version\":0,\"children\":["+child+"]}","a.executor");
  String section=task.at("/task/root/children/0/id").asText();
  task=send(prefix+section+"/configure","{\"version\":"+task.get("version")+",\"children\":[{\"kind\":\"TECHNICAL\",\"regulationId\":\"R1\",\"templateVersionId\":\"T-v1\",\"executor\":\"a.executor\",\"reviewers\":[\"a.reviewer\"]}]}","a.executor");
  String sub=task.at("/task/root/children/0/children/0/id").asText();
  task=send(prefix+sub+"/actions/save","{\"version\":"+task.get("version")+",\"values\":{\"mass\":123}}","a.executor");
  task=send(prefix+sub+"/actions/submit","{\"version\":"+task.get("version")+"}","a.executor");
  mvc.perform(post(prefix+sub+"/actions/approve").header("Authorization",auth("a.executor")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"version\":"+task.get("version")+"}")).andExpect(status().isConflict());
  task=send(prefix+sub+"/actions/reject","{\"version\":"+task.get("version")+",\"comment\":\"Fix value\"}","a.reviewer");
  task=send(prefix+sub+"/actions/submit","{\"version\":"+task.get("version")+"}","a.executor");
  task=send(prefix+sub+"/actions/approve","{\"version\":"+task.get("version")+"}","a.reviewer");
  assertThat(task.at("/task/root/children/0/state").asText()).isEqualTo("REVIEWING");
  mvc.perform(post(prefix+sub+"/actions/save").header("Authorization",auth("a.executor")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"version\":"+task.get("version")+",\"values\":{}}")).andExpect(status().isConflict());
  task=send(prefix+section+"/actions/approve","{\"version\":"+task.get("version")+"}","a.reviewer");
  assertThat(task.at("/task/root/state").asText()).isEqualTo("REVIEWING");
  task=send(prefix+id+"/actions/approve","{\"version\":"+task.get("version")+"}","a.reviewer");
  assertThat(task.at("/task/root/state").asText()).isEqualTo("COMPLETED");
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM outbox_event WHERE aggregate_id=?",Integer.class,id)).isEqualTo(1);
 }
 @Test void rejectsUnauthenticatedCalls() throws Exception { mvc.perform(get("/api/v1/tasks/unknown")).andExpect(status().isUnauthorized()); }
 @Test void rejectsDuplicateSectionsAndStaleVersion() throws Exception {
  var task=create(UUID.randomUUID().toString()); String id=task.get("id").asText();
  String child="{\"kind\":\"TECHNICAL\",\"executor\":\"a.executor\",\"reviewers\":[\"a.reviewer\"]}";
  mvc.perform(post("/api/v1/tasks/"+id+"/nodes/"+id+"/configure").header("Authorization",auth("a.executor")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"version\":0,\"children\":["+child+","+child+"]}")).andExpect(status().isConflict());
  mvc.perform(post("/api/v1/tasks/"+id+"/nodes/"+id+"/configure").header("Authorization",auth("a.executor")).contentType(MediaType.APPLICATION_JSON)
   .content("{\"version\":99,\"children\":["+child+"]}")).andExpect(status().isConflict());
 }
}
