package com.metritag.hmg;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TaskRepository extends JpaRepository<TaskAggregate, String> {
 java.util.List<TaskAggregate> findByTenantIdOrderByIdAsc(String tenantId);
 Optional<TaskAggregate> findByIdAndTenantId(String id, String tenantId);
 Optional<TaskAggregate> findByTenantIdAndRequestKey(String tenantId, String requestKey);
}
