package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.dto.SLAMetricsDTO;
import com.resolveit.resloveitbackend.service.SLAService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/sla")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
public class SLAController {

    private final SLAService slaService;

    public SLAController(SLAService slaService) {
        this.slaService = slaService;
    }

    /**
     * Get overall SLA metrics
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<SLAService.SLAMetrics> getSLAMetrics() {
        return ResponseEntity.ok(slaService.getSLAMetrics());
    }

    /**
     * Manually trigger escalation (Admin only)
     */
    @PostMapping("/escalate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> triggerEscalation() {
        try {
            int escalated = slaService.escalateOverdueComplaints();
            log.info("Manual escalation triggered - {} complaints escalated", escalated);
            return ResponseEntity.ok(
                    String.format("Successfully escalated %d complaints", escalated)
            );
        } catch (Exception e) {
            log.error("Error during manual escalation", e);
            return ResponseEntity.internalServerError()
                    .body("Escalation failed: " + e.getMessage());
        }
    }

    /**
     * Get SLA configuration
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSLAConfig() {
        return ResponseEntity.ok(Map.of(
                "high_priority_hours", slaService.getSlaHighPriority(),
                "medium_priority_hours", slaService.getSlaMediumPriority(),
                "low_priority_hours", slaService.getSlaLowPriority(),
                "response_high_hours", slaService.getResponseHighPriority(),
                "response_medium_hours", slaService.getResponseMediumPriority(),
                "response_low_hours", slaService.getResponseLowPriority()
        ));
    }
}