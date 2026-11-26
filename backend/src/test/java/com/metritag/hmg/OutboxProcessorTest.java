package com.metritag.hmg;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:outboxtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@ActiveProfiles("dev")
class OutboxProcessorTest {
 @TestConfiguration
 static class GatewayConfig {
  @Bean @Primary ControlledArtifactGateway controlledArtifactGateway(LocalArtifactGateway delegate) {
   return new ControlledArtifactGateway(delegate);
  }
 }
 static class ControlledArtifactGateway implements ArtifactGateway {
  private final ArtifactGateway delegate;
  volatile boolean fail;
  volatile int calls;
  ControlledArtifactGateway(ArtifactGateway delegate) { this.delegate = delegate; }
  @Override public List<String> generate(String eventId, String aggregateId, String version, String payload) {
   calls++;
   if (fail) throw new IllegalStateException("gateway down");
   return delegate.generate(eventId, aggregateId, version, payload);
  }
 }

 @Autowired OutboxProcessor processor;
 @Autowired OutboxRepository repository;
 @Autowired JdbcTemplate jdbc;
 @Autowired ControlledArtifactGateway gateway;

 void insert(String id, OutboxEvent.State state, int attempts, OffsetDateTime availableAt) {
  jdbc.update("INSERT INTO task_aggregate (id,tenant_id,request_key,request_hash,version,payload) VALUES (?,?,?,?,?,?)",
   id, "a", "outbox-test:" + id, UUID.randomUUID().toString().replace("-", ""), 0L, "{\"version\":0}");
  jdbc.update("INSERT INTO outbox_event (id,tenant_id,aggregate_id,event_type,payload,created_at,state,attempts,available_at) "
   + "VALUES (?,?,?,?,?,?,?,?,?)", id, "a", id, "hmg.task.completed.v1",
   "{\"version\":7}", OffsetDateTime.now(), state.name(), attempts, availableAt);
 }
 int artifacts(String eventId) {
  return jdbc.queryForObject("SELECT COUNT(*) FROM archive_artifact WHERE event_id=?", Integer.class, eventId);
 }

 @Test void pendingEventCompletesOnceAndArtifactsAreDeduplicated() {
  String id = UUID.randomUUID().toString();
  insert(id, OutboxEvent.State.PENDING, 0, OffsetDateTime.now().minusMinutes(1));

  var result = processor.processDue(10);

  assertThat(result.processed()).isEqualTo(1);
  var event = repository.findById(id).orElseThrow();
  assertThat(event.state).isEqualTo(OutboxEvent.State.COMPLETED);
  assertThat(event.attempts).isEqualTo(1);
  assertThat(event.lastError).isNull();
  assertThat(artifacts(id)).isEqualTo(2);
  assertThat(jdbc.queryForList("SELECT content_ref FROM archive_artifact WHERE event_id=? ORDER BY artifact_type", String.class, id))
   .containsExactly("local-stand-in://" + id + "/v7/archive-manifest",
                    "local-stand-in://" + id + "/v7/report");

  var replay = processor.processDue(10);
  assertThat(replay.processed()).isZero();
  assertThat(artifacts(id)).isEqualTo(2);
 }

 @Test void failedEventRetriesAfterBackoffAndClearsError() {
  gateway.fail = true;
  String id = UUID.randomUUID().toString();
  insert(id, OutboxEvent.State.PENDING, 0, OffsetDateTime.now().minusMinutes(1));

  var failed = processor.processDue(10);

  assertThat(failed.failed()).isEqualTo(1);
  var event = repository.findById(id).orElseThrow();
  assertThat(event.state).isEqualTo(OutboxEvent.State.FAILED);
  assertThat(event.attempts).isEqualTo(1);
  assertThat(event.lastError).contains("gateway down");
  assertThat(event.availableAt).isAfter(OffsetDateTime.now());
  assertThat(artifacts(id)).isZero();

  jdbc.update("UPDATE outbox_event SET available_at=? WHERE id=?", OffsetDateTime.now().minusMinutes(1), id);
  gateway.fail = false;
  var retried = processor.retryFailed(10);

  assertThat(retried.processed()).isEqualTo(1);
  event = repository.findById(id).orElseThrow();
  assertThat(event.state).isEqualTo(OutboxEvent.State.COMPLETED);
  assertThat(event.attempts).isEqualTo(2);
  assertThat(event.lastError).isNull();
  assertThat(artifacts(id)).isEqualTo(2);
 }

 @Test void exhaustedRetriesAreSkippedWithoutCallingGateway() {
  String id = UUID.randomUUID().toString();
  insert(id, OutboxEvent.State.FAILED, 5, OffsetDateTime.now().minusMinutes(1));
  int before = gateway.calls;

  var result = processor.retryFailed(10);

  assertThat(result.processed()).isZero();
  assertThat(result.failed()).isZero();
  assertThat(result.skipped()).isGreaterThanOrEqualTo(1);
  assertThat(gateway.calls).isEqualTo(before);
  assertThat(repository.findById(id).orElseThrow().state).isEqualTo(OutboxEvent.State.FAILED);
 }
}
