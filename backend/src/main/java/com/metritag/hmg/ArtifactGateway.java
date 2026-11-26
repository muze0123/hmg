package com.metritag.hmg;
import java.util.List;

/**
 * Boundary for producing formal artifacts and archiving them. The production implementation
 * must call the platform file/archive services. The development adapter only records local
 * stand-in references and explicitly does not claim a real document was produced.
 */
public interface ArtifactGateway {
 List<String> generate(String eventId, String aggregateId, String version, String payload);
}
