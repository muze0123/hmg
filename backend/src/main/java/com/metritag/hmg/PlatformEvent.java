package com.metritag.hmg;
import jakarta.persistence.*;
@Entity
@Table(name="platform_event")
public class PlatformEvent {
 @Id public String id;
 @Column(name="tenant_id", nullable=false) public String tenantId;
 @Column(nullable=false) public String kind;
 @Column(name="business_id") public String businessId;
 @Column(name="request_hash", nullable=false) public String requestHash;
 @Column(name="result_json", columnDefinition="text") public String resultJson;
 @Column(name="created_at", nullable=false) public java.time.OffsetDateTime createdAt;
}
