package com.metritag.hmg;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
/** Observability and manual processing of the outbox. Dev-only until platform adapters connect. */
@RestController
@Profile("dev")
@RequestMapping("/api/v1/outbox")
public class OutboxController {
 private final OutboxProcessor processor;
 public OutboxController(OutboxProcessor processor) { this.processor = processor; }
 @GetMapping public List<OutboxEvent> list(@RequestParam(defaultValue="50") int limit) { return processor.list(limit); }
 @PostMapping("/process") public OutboxProcessor.ProcessResult process(@RequestParam(defaultValue="10") int limit) {
  OutboxProcessor.ProcessResult fresh = processor.processDue(limit);
  OutboxProcessor.ProcessResult retry = processor.retryFailed(limit);
  return new OutboxProcessor.ProcessResult(
   fresh.processed()+retry.processed(), fresh.failed()+retry.failed(), fresh.skipped()+retry.skipped());
 }
}
