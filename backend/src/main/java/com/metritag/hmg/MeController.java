package com.metritag.hmg;

import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only identity of the authenticated account, used by the shell account popover.
 * Account and tenant come from the authenticated identity and can never be supplied by the
 * request. Display name, department and role labels come from trusted server-side
 * configuration (development directory entries, or platform directory claims in production);
 * missing values are returned as null so the front end can render a deliberate placeholder
 * instead of an invented value.
 */
@RestController
public class MeController {
 public record Profile(String account, String tenantId, String tenantName, String displayName,
                       String department, List<String> roles) {}

 private final String directory;
 private final String tenantNames;

 public MeController(@Value("${hmg.account.directory:}") String directory,
                     @Value("${hmg.tenant.names:}") String tenantNames) {
  this.directory = directory;
  this.tenantNames = tenantNames;
 }

 @GetMapping("/api/v1/me")
 public Profile me(Authentication auth) {
  Actor actor = Actor.from(auth);
  Entry entry = Entry.of(directory, actor.user());
  String displayName = entry != null && entry.displayName() != null ? entry.displayName()
   : auth.getPrincipal() instanceof Jwt jwt && jwt.getClaimAsString("name") != null ? jwt.getClaimAsString("name")
   : null;
  String department = entry != null && entry.department() != null ? entry.department()
   : auth.getPrincipal() instanceof Jwt jwt && jwt.getClaimAsString("department") != null ? jwt.getClaimAsString("department")
   : null;
  List<String> roles = entry != null && entry.roles() != null && !entry.roles().isEmpty() ? entry.roles()
   : auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
    .map(value -> value.replaceFirst("^ROLE_", "")).map(value -> value.toLowerCase(Locale.ROOT)).toList();
  String tenantName = tenantNameOf(tenantNames, actor.tenant());
  if (tenantName == null && auth.getPrincipal() instanceof Jwt jwt) tenantName = jwt.getClaimAsString("tenant_name");
  return new Profile(actor.user(), actor.tenant(), tenantName,
   displayName, department, roles);
 }

 /** Development tenant directory format: {@code tenantId|tenantName;...}; the value is small and this endpoint is low-traffic. */
 static String tenantNameOf(String directory, String tenantId) {
  if (directory == null || directory.isBlank()) return null;
  for (String raw : directory.split(";")) {
   String[] parts = raw.split("\\|", -1);
   if (parts.length < 2 || !parts[0].trim().equals(tenantId)) continue;
   String name = parts[1].trim();
   return name.isEmpty() ? null : name;
  }
  return null;
 }

 /**
  * Development directory format: {@code account|displayName|department|role,role;account|...}.
  * Parsed on every call so operators can change labels without a rebuild; the value is small
  * and this endpoint is low-traffic.
  */
 private record Entry(String displayName, String department, List<String> roles) {
  static Entry of(String directory, String account) {
   if (directory == null || directory.isBlank()) return null;
   for (String raw : directory.split(";")) {
    String[] parts = raw.split("\\|", -1);
    if (parts.length < 4 || !parts[0].trim().equals(account)) continue;
    String name = parts[1].trim(), department = parts[2].trim();
    List<String> roles = java.util.Arrays.stream(parts[3].split(","))
     .map(String::trim).filter(value -> !value.isEmpty()).toList();
    return new Entry(name.isEmpty() ? null : name, department.isEmpty() ? null : department, roles);
   }
   return null;
  }
 }
}
