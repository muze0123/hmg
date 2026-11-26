package com.metritag.hmg;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
public interface OutboxRepository extends JpaRepository<OutboxEvent, String> {
 // Candidate selection is deliberately lock-free; each event is re-locked by id in its own
 // transaction before mutation, so one worker cannot claim an event another is processing.
 @Query("select e from OutboxEvent e where e.state = :state and e.availableAt <= :now order by e.availableAt asc")
 List<OutboxEvent> findDue(@Param("state") OutboxEvent.State state, @Param("now") OffsetDateTime now, Pageable pageable);

 @Query("select e from OutboxEvent e where e.state = com.metritag.hmg.OutboxEvent.State.FAILED and e.availableAt <= :now order by e.availableAt asc")
 List<OutboxEvent> findFailedDue(@Param("now") OffsetDateTime now, Pageable pageable);

 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select e from OutboxEvent e where e.id = :id")
 Optional<OutboxEvent> findByIdForUpdate(@Param("id") String id);
}
