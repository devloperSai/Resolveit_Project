package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.service.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = analyticsService.getDashboardStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching dashboard stats", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch dashboard statistics");
        }
    }

    /**
     * Get category-wise distribution
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategoryDistribution() {
        return ResponseEntity.ok(analyticsService.getCategoryDistribution());
    }

    /**
     * Get priority distribution
     */
    @GetMapping("/priorities")
    public ResponseEntity<?> getPriorityDistribution() {
        return ResponseEntity.ok(analyticsService.getPriorityDistribution());
    }

    /**
     * Get officer workload
     */
    @GetMapping("/officer-workload")
    public ResponseEntity<?> getOfficerWorkload() {
        return ResponseEntity.ok(analyticsService.getOfficerWorkload());
    }

    /**
     * Get trend data (last 30 days)
     */
    @GetMapping("/trends")
    public ResponseEntity<?> getTrendData(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getTrendData(days));
    }
}