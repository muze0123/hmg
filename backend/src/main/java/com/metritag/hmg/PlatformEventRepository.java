package com.metritag.hmg;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PlatformEventRepository extends JpaRepository<PlatformEvent, String> {
 Optional<PlatformEvent> findByIdAndTenantId(String id, String tenantId);
}
