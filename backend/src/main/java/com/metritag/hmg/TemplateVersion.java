package com.metritag.hmg;
import jakarta.persistence.*;
@Entity @Table(name="template_version")
public class TemplateVersion {
 @Id public String id;
 @Column(name="tenant_id", nullable=false) public String tenantId;
 @Column(name="template_id", nullable=false) public String templateId;
 @Column(nullable=false) public String revision;
 @Column(nullable=false) public boolean published;
 @Column(name="schema_json", nullable=false, columnDefinition="text") public String schemaJson;
}
