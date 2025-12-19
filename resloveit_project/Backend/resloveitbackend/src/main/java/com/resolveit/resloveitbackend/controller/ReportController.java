package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Report;
import com.resolveit.resloveitbackend.service.ReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('OFFICER')")
    public ResponseEntity<?> submitReport(
            @RequestParam Long complaintId,
            @RequestParam String officerEmail,
            @RequestParam String officerName,
            @RequestParam String actionTaken,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String recommendations,
            @RequestParam(required = false) MultipartFile[] files,
            Authentication authentication
    ) {
        try {
            String authEmail = authentication.getName();
            if (!authEmail.equals(officerEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only submit reports for yourself");
            }

            Report report = reportService.submitReport(
                    complaintId,
                    officerEmail,
                    officerName,
                    actionTaken,
                    description,
                    recommendations,
                    files
            );

            log.info("Report {} submitted for complaint {}", report.getId(), complaintId);

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error submitting report", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/exists/{complaintId}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<?> checkReportExists(@PathVariable Long complaintId) {
        boolean exists = reportService.hasReport(complaintId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/complaint/{complaintId}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<?> getReportByComplaint(@PathVariable Long complaintId) {
        Report report = reportService.getReportByComplaintId(complaintId);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No report found for this complaint");
        }
        return ResponseEntity.ok(report);
    }

    @GetMapping("/officer/{officerEmail}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<?> getOfficerReports(
            @PathVariable String officerEmail,
            Authentication authentication
    ) {
        String authEmail = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !authEmail.equals(officerEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied");
        }

        List<Report> reports = reportService.getOfficerReports(officerEmail);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingReports() {
        List<Report> reports = reportService.getPendingReports();
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/{reportId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        try {
            String notes = body != null ? body.get("notes") : null;
            Report report = reportService.approveReport(
                    reportId,
                    authentication.getName(),
                    notes
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error approving report", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @PostMapping("/{reportId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        try {
            String notes = body.get("notes");
            if (notes == null || notes.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Rejection reason is required");
            }

            Report report = reportService.rejectReport(
                    reportId,
                    authentication.getName(),
                    notes
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error rejecting report", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/validate-resolution/{complaintId}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<?> validateResolution(@PathVariable Long complaintId) {
        boolean hasReport = reportService.hasReport(complaintId);
        
        if (!hasReport) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                    .body(Map.of(
                            "canResolve", false,
                            "message", "Report must be submitted before resolving complaint"
                    ));
        }

        return ResponseEntity.ok(Map.of(
                "canResolve", true,
                "message", "Complaint can be resolved"
        ));
    }
}
