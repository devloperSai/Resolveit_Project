package com.resolveit.resloveitbackend.controller;
import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.Report;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.service.ReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {
    private final ReportService reportService;
    private final ComplaintRepository complaintRepository;
    public AdminReportController(ReportService reportService,
                                 ComplaintRepository complaintRepository) {
        this.reportService = reportService;
        this.complaintRepository = complaintRepository;
    }
    /**
     * Get all reports with complaint details
     */
    @GetMapping("/reports/all")
    public ResponseEntity<?> getAllReports() {
        try {
            List<Report> reports = reportService.getAllReports();
           
            // Enrich with complaint details
            List<Map<String, Object>> enrichedReports = reports.stream()
                    .map(report -> {
                        Map<String, Object> data = new HashMap<>();
                        data.put("report", report);
                       
                        // Fetch associated complaint
                        Optional<Complaint> complaint = complaintRepository
                                .findById(report.getComplaintId());
                       
                        complaint.ifPresent(c -> {
                            Map<String, Object> complaintData = new HashMap<>();
                            complaintData.put("id", c.getId());
                            complaintData.put("title", c.getTitle());
                            complaintData.put("category", c.getCategory());
                            complaintData.put("priority", c.getPriority());
                            complaintData.put("status", c.getStatus());
                            complaintData.put("submittedBy", c.getSubmittedBy());
                            complaintData.put("submittedAt", c.getSubmittedAt());
                            data.put("complaint", complaintData);
                        });
                       
                        return data;
                    })
                    .collect(Collectors.toList());
           
            return ResponseEntity.ok(enrichedReports);
        } catch (Exception e) {
            log.error("Error fetching all reports", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch reports");
        }
    }
    /**
     * Get pending reports (submitted but not reviewed)
     */
    @GetMapping("/reports/pending")
    public ResponseEntity<?> getPendingReports() {
        try {
            List<Report> reports = reportService.getPendingReports();
           
            List<Map<String, Object>> enrichedReports = reports.stream()
                    .map(report -> {
                        Map<String, Object> data = new HashMap<>();
                        data.put("report", report);
                       
                        complaintRepository.findById(report.getComplaintId())
                                .ifPresent(c -> {
                                    Map<String, Object> complaintData = new HashMap<>();
                                    complaintData.put("id", c.getId());
                                    complaintData.put("title", c.getTitle());
                                    complaintData.put("category", c.getCategory());
                                    complaintData.put("priority", c.getPriority());
                                    data.put("complaint", complaintData);
                                });
                       
                        return data;
                    })
                    .collect(Collectors.toList());
           
            return ResponseEntity.ok(enrichedReports);
        } catch (Exception e) {
            log.error("Error fetching pending reports", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch pending reports");
        }
    }
    /**
     * Get report count
     */
    @GetMapping("/reports/count")
    public ResponseEntity<?> getReportCount() {
        try {
            long total = reportService.getTotalReportCount();
            long pending = reportService.getPendingReportCount();
           
            Map<String, Object> counts = new HashMap<>();
            counts.put("total", total);
            counts.put("pending", pending);
            counts.put("reviewed", total - pending);
           
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            log.error("Error fetching report counts", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch report counts");
        }
    }
    /**
     * Get new complaints (submitted in last 24 hours)
     */
    @GetMapping("/complaints/new")
    public ResponseEntity<?> getNewComplaints() {
        try {
            LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
            List<Complaint> newComplaints = complaintRepository
                    .findBySubmittedAtAfter(yesterday);
           
            return ResponseEntity.ok(newComplaints);
        } catch (Exception e) {
            log.error("Error fetching new complaints", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch new complaints");
        }
    }
    /**
     * Get high alerts (complaints near escalation)
     */
    @GetMapping("/complaints/high-alerts")
    public ResponseEntity<?> getHighAlerts() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime warningThreshold = now.plusHours(2); // 2 hours warning
           
            List<Complaint> complaints = complaintRepository.findAll();
           
            List<Map<String, Object>> highAlerts = complaints.stream()
                    .filter(c -> c.getSlaDue() != null)
                    .filter(c -> !c.getStatus().name().equals("RESOLVED"))
                    .filter(c -> {
                        LocalDateTime slaDue = c.getSlaDue();
                        return slaDue.isBefore(warningThreshold) && slaDue.isAfter(now);
                    })
                    .map(c -> {
                        Map<String, Object> alert = new HashMap<>();
                        alert.put("id", c.getId());
                        alert.put("title", c.getTitle());
                        alert.put("priority", c.getPriority());
                        alert.put("status", c.getStatus());
                        alert.put("slaDue", c.getSlaDue());
                        alert.put("assignedTo", c.getAssignedTo());
                       
                        // Calculate hours until escalation
                        long hoursUntil = java.time.Duration
                                .between(now, c.getSlaDue())
                                .toHours();
                        alert.put("hoursUntilEscalation", hoursUntil);
                       
                        return alert;
                    })
                    .sorted((a, b) -> {
                        Long hoursA = (Long) a.get("hoursUntilEscalation");
                        Long hoursB = (Long) b.get("hoursUntilEscalation");
                        return hoursA.compareTo(hoursB);
                    })
                    .collect(Collectors.toList());
           
            return ResponseEntity.ok(highAlerts);
        } catch (Exception e) {
            log.error("Error fetching high alerts", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch high alerts");
        }
    }
    /**
     * Get notification counts
     */
    @GetMapping("/notifications/counts")
    public ResponseEntity<?> getNotificationCounts() {
        try {
            Map<String, Long> counts = new HashMap<>();
           
            // New complaints (last 24 hours)
            LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
            long newComplaints = complaintRepository
                    .countBySubmittedAtAfter(yesterday);
            counts.put("newComplaints", newComplaints);
           
            // Pending reports
            long pendingReports = reportService.getPendingReportCount();
            counts.put("pendingReports", pendingReports);
           
            // High alerts
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime warningThreshold = now.plusHours(2);
            long highAlerts = complaintRepository.findAll().stream()
                    .filter(c -> c.getSlaDue() != null)
                    .filter(c -> !c.getStatus().name().equals("RESOLVED"))
                    .filter(c -> {
                        LocalDateTime slaDue = c.getSlaDue();
                        return slaDue.isBefore(warningThreshold) && slaDue.isAfter(now);
                    })
                    .count();
            counts.put("highAlerts", highAlerts);
           
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            log.error("Error fetching notification counts", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch notification counts");
        }
    }

    /**
     * Get comprehensive day summary statistics
     */
    @GetMapping("/day-summary")
    public ResponseEntity<?> getDaySummary() {
        try {
            LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
            LocalDateTime now = LocalDateTime.now();
           
            Map<String, Object> summary = new HashMap<>();
           
            // Today's new complaints
            List<Complaint> todaysComplaints = complaintRepository.findBySubmittedAtBetween(startOfDay, now);
            long newComplaintsToday = todaysComplaints.size();
            summary.put("newComplaintsToday", newComplaintsToday);
           
            // Reports submitted today
            long reportsToday = reportService.getAllReports().stream()
                    .filter(r -> r.getSubmittedAt() != null && r.getSubmittedAt().isAfter(startOfDay))
                    .count();
            summary.put("reportsSubmittedToday", reportsToday);
           
            // Complaints resolved today
            long resolvedToday = complaintRepository.findAll().stream()
                    .filter(c -> c.getClosedAt() != null)
                    .filter(c -> c.getClosedAt().isAfter(startOfDay))
                    .count();
            summary.put("resolvedToday", resolvedToday);
           
            // Complaints in progress
            long inProgress = complaintRepository.findAll().stream()
                    .filter(c -> c.getStatus().name().equals("IN_PROGRESS") ||
                                c.getStatus().name().equals("ASSIGNED"))
                    .count();
            summary.put("inProgress", inProgress);
           
            // Escalations today
            long escalationsToday = complaintRepository.findAll().stream()
                    .filter(c -> c.getEscalationLevel() != null && c.getEscalationLevel() > 0)
                    .filter(c -> {
                        // Check if escalation happened today
                        String history = c.getEscalationHistory();
                        if (history == null || history.isEmpty()) return false;
                        try {
                            // Parse JSON to check escalation dates
                            return history.contains(startOfDay.toLocalDate().toString());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            summary.put("escalationsToday", escalationsToday);
           
            // Average resolution time today (in hours)
            Double avgResolutionTime = complaintRepository.findAll().stream()
                    .filter(c -> c.getClosedAt() != null)
                    .filter(c -> c.getClosedAt().isAfter(startOfDay))
                    .filter(c -> c.getSubmittedAt() != null)
                    .mapToLong(c -> Duration
                            .between(c.getSubmittedAt(), c.getClosedAt())
                            .toHours())
                    .average()
                    .orElse(0.0);
            summary.put("avgResolutionTimeHours", Math.round(avgResolutionTime * 10) / 10.0);
           
            // High priority pending
            long highPriorityPending = complaintRepository.findAll().stream()
                    .filter(c -> c.getPriority().name().equals("HIGH"))
                    .filter(c -> !c.getStatus().name().equals("RESOLVED"))
                    .count();
            summary.put("highPriorityPending", highPriorityPending);
           
            // Officer utilization (how many officers are working)
            long activeOfficers = complaintRepository.findAll().stream()
                    .filter(c -> c.getAssignedTo() != null)
                    .filter(c -> !c.getStatus().name().equals("RESOLVED"))
                    .map(Complaint::getAssignedTo)
                    .distinct()
                    .count();
            summary.put("activeOfficers", activeOfficers);
           
            // SLA compliance rate today
            List<Complaint> resolvedTodayList = complaintRepository.findAll().stream()
                    .filter(c -> c.getClosedAt() != null)
                    .filter(c -> c.getClosedAt().isAfter(startOfDay))
                    .collect(Collectors.toList());
           
            long onTime = resolvedTodayList.stream()
                    .filter(c -> c.getSlaDue() != null)
                    .filter(c -> c.getClosedAt().isBefore(c.getSlaDue()))
                    .count();
           
            double slaCompliance = resolvedTodayList.isEmpty() ? 100.0 :
                    (onTime * 100.0 / resolvedTodayList.size());
            summary.put("slaComplianceToday", Math.round(slaCompliance * 10) / 10.0);
           
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error fetching day summary", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to fetch day summary");
        }
    }
}