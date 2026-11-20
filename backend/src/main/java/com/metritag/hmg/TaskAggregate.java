package com.metritag.hmg;
import jakarta.persistence.*;
@Entity
@Table(name="task_aggregate")
public class TaskAggregate {
 @Id public String id;
 @Column(name="tenant_id", nullable=false) public String tenantId;
 @Column(name="request_key", nullable=false) public String requestKey;
 @Column(name="request_hash", nullable=false) public String requestHash;
 @Version public long version;
 @Column(nullable=false, columnDefinition="text") public String payload;
}
