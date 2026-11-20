CREATE TABLE task_aggregate (
 id VARCHAR(36) PRIMARY KEY,
 tenant_id VARCHAR(100) NOT NULL,
 request_key VARCHAR(100) NOT NULL,
 request_hash VARCHAR(64) NOT NULL,
 version BIGINT NOT NULL,
 payload TEXT NOT NULL,
 CONSTRAINT uq_task_request UNIQUE (tenant_id, request_key)
);
CREATE INDEX idx_task_tenant ON task_aggregate (tenant_id, id);
CREATE TABLE outbox_event (
 id VARCHAR(36) PRIMARY KEY,
 tenant_id VARCHAR(100) NOT NULL,
 aggregate_id VARCHAR(36) NOT NULL REFERENCES task_aggregate(id),
 event_type VARCHAR(100) NOT NULL,
 payload TEXT NOT NULL,
 state VARCHAR(20) NOT NULL DEFAULT 'PENDING',
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 CONSTRAINT uq_task_event UNIQUE (aggregate_id, event_type)
);
