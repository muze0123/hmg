package com.metritag.hmg;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ServiceController {
    @GetMapping("/")
    public Map<String, String> information() {
        return Map.of(
            "service", "HMG API",
            "status", "RUNNING",
            "tasksEndpoint", "/api/v1/tasks"
        );
    }
}
