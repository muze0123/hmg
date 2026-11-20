package com.metritag.hmg;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {
 private final TaskService service;
 public TaskController(TaskService service) { this.service = service; }
 @PostMapping
 @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
 public TaskService.View create(@Valid @RequestBody TaskService.Create input,
  @RequestHeader("Idempotency-Key") String key, Authentication auth) {
  return service.create(input, key, Actor.from(auth));
 }
 @GetMapping
 public java.util.List<TaskService.View> list(Authentication auth) { return service.list(Actor.from(auth)); }
 @GetMapping("/{id}")
 public TaskService.View get(@PathVariable String id, Authentication auth) { return service.get(id, Actor.from(auth)); }
 @PostMapping("/{id}/nodes/{nodeId}/configure")
 public TaskService.View configure(@PathVariable String id, @PathVariable String nodeId,
  @Valid @RequestBody TaskService.Configure input, Authentication auth) {
  return service.configure(id, nodeId, input, Actor.from(auth));
 }
 @PostMapping("/{id}/nodes/{nodeId}/actions/{action}")
 public TaskService.View command(@PathVariable String id, @PathVariable String nodeId, @PathVariable String action,
  @Valid @RequestBody TaskService.Command input, Authentication auth) {
  return service.command(id, nodeId, action, input, Actor.from(auth));
 }
}
