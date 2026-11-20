package com.metritag.hmg;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/template-versions")
public class TemplateController {
 private final TemplateService service;
 public TemplateController(TemplateService service) { this.service=service; }
 @GetMapping public List<TemplateService.View> list(Authentication auth) { return service.list(Actor.from(auth)); }
 @GetMapping("/{id}") public TemplateService.View get(@PathVariable String id,Authentication auth) { return service.get(id,Actor.from(auth)); }
 @PostMapping @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
 public TemplateService.View create(@Valid @RequestBody TemplateSchema schema,Authentication auth) { return service.create(schema,Actor.from(auth)); }
 @PostMapping("/{id}/publish") public TemplateService.View publish(@PathVariable String id,Authentication auth) { return service.publish(id,Actor.from(auth)); }
}
