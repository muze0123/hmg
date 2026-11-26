package com.metritag.hmg;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Drives completed-task events through PENDING → GENERATING → ARCHIVING → COMPLETED.
 * Artifact generation is delegated to an {@link ArtifactGateway}; when no gateway is configured
 * (production without platform adapters) events stay PENDING and are never falsely completed.
 * Retries are bounded and use a linear backoff. Each event is processed in its own transaction,
 * so one failure cannot roll back its siblings, and is idempotent by event id — a COMPLETED
 * event is never reprocessed.
 */
@Service
public class OutboxProcessor {
 public record ProcessResult(int processed, int failed, int skipped) {}
 private static final int MAX_ATTEMPTS = 5;
 private final OutboxRepository repository;
 private final ArtifactGateway gateway;
 private final ObjectMapper json;
 private final TransactionTemplate transactions;
 public OutboxProcessor(OutboxRepository repository,
                        @org.springframework.beans.factory.annotation.Autowired(required = false) ArtifactGateway gateway,
                        ObjectMapper json, PlatformTransactionManager manager) {
  this.repository = repository; this.gateway = gateway; this.json = json;
  this.transactions = new TransactionTemplate(manager);
  this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
 }

 /** Process up to {@code limit} due events. Returns counts for observability. */
 public ProcessResult processDue(int limit) {
  if (gateway == null) return new ProcessResult(0, 0, 0);
  List<OutboxEvent> due = repository.findDue(OutboxEvent.State.PENDING, OffsetDateTime.now(),
   org.springframework.data.domain.PageRequest.of(0, Math.max(1, Math.min(limit, 100))));
  int ok = 0, bad = 0;
  for (OutboxEvent event : due) {
   try { transactions.executeWithoutResult(status -> run(event)); ok++; }
   catch (RuntimeException error) {
    transactions.executeWithoutResult(status -> fail(event, error));
    bad++;
   }
  }
  return new ProcessResult(ok, bad, due.size() - ok - bad);
 }

 void run(OutboxEvent event) {
  // Re-load under lock to avoid double processing across concurrent workers.
  OutboxEvent locked = repository.findByIdForUpdate(event.id).orElseThrow();
  if (locked.state != OutboxEvent.State.PENDING && locked.state != OutboxEvent.State.FAILED) return;
  locked.state = OutboxEvent.State.GENERATING; locked.attempts++; repository.saveAndFlush(locked);
  List<String> refs = gateway.generate(locked.id, locked.aggregateId, versionOf(locked), locked.payload);
  locked.state = OutboxEvent.State.ARCHIVING; repository.saveAndFlush(locked);
  // Artifact refs are persisted by the gateway, keyed by event id (dedup).
  locked.state = OutboxEvent.State.COMPLETED; locked.lastError = null; repository.saveAndFlush(locked);
 }

 void fail(OutboxEvent event, RuntimeException error) {
  OutboxEvent locked = repository.findByIdForUpdate(event.id).orElseThrow();
  if (locked.state == OutboxEvent.State.COMPLETED) return;
  locked.state = OutboxEvent.State.FAILED;
  locked.attempts++;
  locked.lastError = String.valueOf(error.getMessage());
  long backoffMinutes = Math.max(1L, locked.attempts);
  locked.availableAt = OffsetDateTime.now().plusMinutes(backoffMinutes);
  repository.saveAndFlush(locked);
 }

 /**
  * FAILED events become due again after backoff; PENDING is reserved for fresh events.
  * A failed event that exhausted retries is left FAILED and reported, never force-completed.
  */
 public ProcessResult retryFailed(int limit) {
  if (gateway == null) return new ProcessResult(0, 0, 0);
  List<OutboxEvent> due = repository.findFailedDue(OffsetDateTime.now(),
   org.springframework.data.domain.PageRequest.of(0, Math.max(1, Math.min(limit, 100))));
  int ok = 0, bad = 0;
  for (OutboxEvent event : due) {
   if (event.attempts >= MAX_ATTEMPTS) continue; // counted as skipped below
   try { transactions.executeWithoutResult(status -> run(event)); ok++; }
   catch (RuntimeException error) {
    transactions.executeWithoutResult(status -> fail(event, error));
    bad++;
   }
  }
  return new ProcessResult(ok, bad, due.size() - ok - bad);
 }

 private String versionOf(OutboxEvent event) {
  try {
   var node = json.readTree(event.payload);
   return node.path("version").asText("0");
  } catch (Exception e) { return "0"; }
 }

 public List<OutboxEvent> list(int limit) {
  return repository.findAll(org.springframework.data.domain.PageRequest.of(0, Math.max(1, Math.min(limit, 100)))).getContent();
 }
}
