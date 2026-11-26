package com.metritag.hmg;
import jakarta.persistence.*;
@Entity
@Table(name="outbox_event")
public class OutboxEvent {
 public enum State { PENDING, GENERATING, ARCHIVING, COMPLETED, FAILED }
 @Id public String id;
 @Column(name="tenant_id", nullable=false) public String tenantId;
 @Column(name="aggregate_id", nullable=false) public String aggregateId;
 @Column(name="event_type", nullable=false) public String eventType;
 @Column(nullable=false, columnDefinition="text") public String payload;
 @Enumerated(EnumType.STRING)
 @Column(nullable=false, length=20) public State state = State.PENDING;
 @Column(nullable=false) public int attempts;
 @Column(name="last_error", columnDefinition="text") public String lastError;
 @Column(name="created_at", nullable=false) public java.time.OffsetDateTime createdAt;
 @Column(name="available_at", nullable=false) public java.time.OffsetDateTime availableAt;
}
