package com.metritag.hmg;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Persists local artifact stand-in references. No production document is implied. */
@Component
public class JdbcArtifactStore {
 private final JdbcTemplate jdbc;
 public JdbcArtifactStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
 public List<String> save(String eventId, String aggregateId, List<String> refs) {
  for (int i = 0; i < refs.size(); i++) {
   String type = typeOf(refs.get(i));
   Integer exists = jdbc.queryForObject(
    "SELECT COUNT(*) FROM archive_artifact WHERE event_id=? AND artifact_type=?", Integer.class, eventId, type);
   if (exists != null && exists > 0) continue; // event-id dedup: never regenerate
   jdbc.update("INSERT INTO archive_artifact (id,event_id,aggregate_id,artifact_type,content_ref,created_at) VALUES (?,?,?,?,?,?)",
    UUID.randomUUID().toString(), eventId, aggregateId, type, refs.get(i), OffsetDateTime.now());
  }
  return refs;
 }
 private String typeOf(String ref) {
  String tail = ref.substring(ref.lastIndexOf('/') + 1);
  return tail.length() > 50 ? tail.substring(0, 50) : tail;
 }
}
