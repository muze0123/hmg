package com.metritag.hmg;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Dev-only adapter. Records deterministic stand-in references; no file bytes are produced. */
@Component
@Profile("dev")
public class LocalArtifactGateway implements ArtifactGateway {
 private final JdbcArtifactStore store;
 public LocalArtifactGateway(JdbcArtifactStore store) { this.store = store; }
 @Override
 public List<String> generate(String eventId, String aggregateId, String version, String payload) {
  List<String> types = List.of("report", "archive-manifest");
  List<String> refs = types.stream()
   .map(type -> "local-stand-in://" + aggregateId + "/v" + version + "/" + type).toList();
  return store.save(eventId, aggregateId, refs);
 }
}
