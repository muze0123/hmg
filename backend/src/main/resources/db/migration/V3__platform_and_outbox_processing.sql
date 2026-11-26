-- Platform inbound event deduplication and outbox processing state.
CREATE TABLE platform_event (
 id VARCHAR(200) PRIMARY KEY,
 tenant_id VARCHAR(100) NOT NULL,
 kind VARCHAR(50) NOT NULL,
 business_id VARCHAR(36),
 request_hash VARCHAR(64) NOT NULL,
 result_json TEXT,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_platform_event_tenant ON platform_event (tenant_id, kind, created_at);

ALTER TABLE outbox_event ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE outbox_event ADD COLUMN last_error TEXT;
ALTER TABLE outbox_event ADD COLUMN available_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
