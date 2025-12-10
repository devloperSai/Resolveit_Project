package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.service.SLAService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
public class AlertController {
    
    private final SLAService slaService;
    
    public AlertController(SLAService slaService) {
        this.slaService = slaService;
    }
    
    /**
     * ✅ Get triage alerts for admin dashboard
     */
    @GetMapping("/triage")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getTriageAlerts() {
        List<Complaint> critical = slaService.getTriageCriticalComplaints(); // 9hrs remaining
        List<Complaint> overdue = slaService.getTriageOverdueComplaints(); // Already breached
        
        Map<String, Object> response = new HashMap<>();
        response.put("critical", critical);
        response.put("overdue", overdue);
        response.put("counts", Map.of(
            "critical", critical.size(),
            "overdue", overdue.size()
        ));
        
        return ResponseEntity.ok(response);
    }
}