CREATE TABLE template_version (
 id VARCHAR(36) PRIMARY KEY,
 tenant_id VARCHAR(100) NOT NULL,
 template_id VARCHAR(100) NOT NULL,
 revision VARCHAR(50) NOT NULL,
 published BOOLEAN NOT NULL,
 schema_json TEXT NOT NULL,
 CONSTRAINT uq_template_revision UNIQUE (tenant_id, template_id, revision)
);
CREATE INDEX idx_template_tenant ON template_version (tenant_id, template_id);
