package com.metritag.hmg;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:metest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class MeControllerTest {
 @Autowired MockMvc mvc;
 String auth(String user) {
  return "Basic " + java.util.Base64.getEncoder().encodeToString((user+":development-only").getBytes(java.nio.charset.StandardCharsets.UTF_8));
 }
 @Test void profileIsDerivedFromTheAuthenticatedAccount() throws Exception {
  mvc.perform(get("/api/v1/me").header("Authorization",auth("a.executor")).accept(MediaType.APPLICATION_JSON))
   .andExpect(status().isOk())
   .andExpect(jsonPath("$.account").value("a.executor"))
   .andExpect(jsonPath("$.tenantId").value("a"))
   .andExpect(jsonPath("$.tenantName").value("杭州麦唐科技有限公司"))
   .andExpect(jsonPath("$.displayName").value("张三"))
   .andExpect(jsonPath("$.department").value("研发部"))
   .andExpect(jsonPath("$.roles[0]").value("executor"))
   .andExpect(jsonPath("$.roles[1]").value("reviewer"));
  mvc.perform(get("/api/v1/me").header("Authorization",auth("b.executor")).accept(MediaType.APPLICATION_JSON))
   .andExpect(status().isOk())
   .andExpect(jsonPath("$.account").value("b.executor"))
   .andExpect(jsonPath("$.tenantId").value("b"))
   .andExpect(jsonPath("$.tenantName").value("上海麦唐科技有限公司"))
   .andExpect(jsonPath("$.department").value("测试部"));
 }
 @Test void profileRequiresAuthentication() throws Exception {
  mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
 }
}
