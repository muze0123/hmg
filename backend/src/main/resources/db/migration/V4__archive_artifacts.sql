-- Local archive artifact records. These are stand-ins for the platform file service;
-- no file content is stored here and no real documents are claimed as generated.
CREATE TABLE archive_artifact (
 id VARCHAR(36) PRIMARY KEY,
 event_id VARCHAR(36) NOT NULL REFERENCES outbox_event(id),
 aggregate_id VARCHAR(36) NOT NULL,
 artifact_type VARCHAR(50) NOT NULL,
 content_ref VARCHAR(500) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 CONSTRAINT uq_archive_artifact UNIQUE (event_id, artifact_type)
);
