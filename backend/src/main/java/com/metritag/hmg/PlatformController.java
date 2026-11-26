package com.metritag.hmg;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/platform")
public class PlatformController {
 private final PlatformService service;
 public PlatformController(PlatformService service) { this.service = service; }

 @PostMapping("/task-dispatches")
 @ResponseStatus(HttpStatus.CREATED)
 public PlatformService.Acknowledgement dispatch(@Valid @RequestBody PlatformService.Dispatch input,
                                                  Authentication auth) {
  return service.dispatch(input, Actor.from(auth));
 }

 @PostMapping("/approvals/callbacks")
 public PlatformService.Acknowledgement approval(@Valid @RequestBody PlatformService.ApprovalCallback input,
                                                  Authentication auth) {
  return service.approval(input, Actor.from(auth));
 }
}
