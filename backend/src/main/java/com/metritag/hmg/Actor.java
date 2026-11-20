package com.metritag.hmg;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
public record Actor(String tenant, String user) {
 public static Actor from(Authentication authentication) {
  if (authentication.getPrincipal() instanceof Jwt jwt) {
   String tenant = jwt.getClaimAsString("tenant_id");
   TaskTree.require(tenant != null && !tenant.isBlank(), "Tenant claim is required");
   return new Actor(tenant, jwt.getSubject());
  }
  String[] identity = authentication.getName().split("[.]", 2);
  TaskTree.require(identity.length == 2, "Invalid development identity");
  return new Actor(identity[0], authentication.getName());
 }
}
