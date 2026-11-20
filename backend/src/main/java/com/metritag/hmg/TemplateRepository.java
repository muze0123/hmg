package com.metritag.hmg;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface TemplateRepository extends JpaRepository<TemplateVersion, String> {
 Optional<TemplateVersion> findByIdAndTenantId(String id, String tenant);
 List<TemplateVersion> findByTenantIdOrderByTemplateIdAscRevisionAsc(String tenant);
}
