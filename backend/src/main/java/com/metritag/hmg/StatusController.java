package com.metritag.hmg;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/tasks/{id}/status")
public class StatusController {
 private final StatusCompatibility compatibility;
 public StatusController(StatusCompatibility compatibility) { this.compatibility = compatibility; }
 @GetMapping public StatusCompatibility.TaskStatusView get(@PathVariable String id, Authentication auth) {
  return compatibility.get(id, Actor.from(auth));
 }
}
