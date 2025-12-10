package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.dto.*;
import com.resolveit.resloveitbackend.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
@Slf4j
public class ComplaintController {
    
    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /**
     * ✅ Multipart submit with files + location (legacy-style, non-breaking)
     */
    @PostMapping(value = "/submit-with-files", consumes = "multipart/form-data")
    public ResponseEntity<?> submitComplaintWithFiles(
            @RequestParam String email,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Boolean isAnonymous,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) MultipartFile[] files
    ) {
        try {
            Complaint complaint = complaintService.submitComplaintWithFiles(
                    email,
                    title,
                    description,
                    category,
                    isAnonymous,
                    address,
                    city,
                    state,
                    pincode,
                    latitude,
                    longitude,
                    files
            );
            log.info("Complaint {} submitted (multipart) by {}", complaint.getId(), email);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            log.error("Error submitting complaint (multipart)", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to submit complaint: " + e.getMessage());
        }
    }

    /**
     * ✅ Citizen submits a new complaint (JSON body + auto SLA calculation)
     * (kept as-is to avoid breaking existing clients)
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitComplaint(
            @Valid @RequestBody ComplaintRequest request,
            @RequestParam String email
    ) {
        try {
            Complaint complaint = complaintService.submitComplaint(request, email);
            log.info("Complaint {} submitted by {}", complaint.getId(), email);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            log.error("Error submitting complaint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit complaint: " + e.getMessage());
        }
    }

    /**
     * ✅ Get all complaints for a citizen
     */
    @GetMapping("/user")
    public ResponseEntity<?> getUserComplaints(@RequestParam String email) {
        try {
            List<Complaint> complaints = complaintService.getUserComplaints(email);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            log.error("Error fetching user complaints", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch complaints: " + e.getMessage());
        }
    }

    /**
     * ✅ Admin/Officer - Get all complaints
     */
    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    /**
     * ✅ Get single complaint by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable Long id) {
        try {
            Complaint complaint = complaintService.getComplaintById(id);
            return ResponseEntity.ok(complaint);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * ✅ Update complaint priority (recalculates SLA)
     */
    @PutMapping("/{id}/priority")
    public ResponseEntity<?> updatePriority(
            @PathVariable Long id,
            @Valid @RequestBody PriorityUpdateDto dto,
            Authentication authentication
    ) {
        try {
            ComplaintPriority priority = ComplaintPriority.valueOf(dto.getPriority().toUpperCase());
            String updatedBy = authentication.getName();
            
            Complaint updated = complaintService.updatePriority(id, priority, updatedBy);
            log.info("Complaint {} priority updated to {} by {}", id, priority, updatedBy);
            
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid priority. Allowed: LOW, MEDIUM, HIGH");
        } catch (Exception e) {
            log.error("Error updating priority", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update priority: " + e.getMessage());
        }
    }

    /**
     * ✅ Update complaint status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate,
            Authentication authentication
    ) {
        try {
            String statusStr = statusUpdate.get("status");
            if (statusStr == null || statusStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Status is required");
            }

            ComplaintStatus status = ComplaintStatus.valueOf(statusStr.toUpperCase());
            String updatedBy = authentication.getName();
            
            Complaint updated = complaintService.updateStatus(id, status, updatedBy);
            log.info("Complaint {} status updated to {} by {}", id, status, updatedBy);
            
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid status. Allowed: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED");
        } catch (Exception e) {
            log.error("Error updating status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update status: " + e.getMessage());
        }
    }

    /**
     * ✅ Assign complaint to officer
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintAssignmentDTO dto,
            Authentication authentication
    ) {
        try {
            String assignedBy = authentication.getName();
            Complaint updated = complaintService.assignComplaint(
                    id,
                    dto.getOfficerEmail(),
                    assignedBy
            );
            
            log.info("Complaint {} assigned to {} by {}", id, dto.getOfficerEmail(), assignedBy);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error assigning complaint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to assign complaint: " + e.getMessage());
        }
    }

    /**
     * ✅ Close complaint with resolution notes
     */
    @PostMapping("/{id}/close")
    public ResponseEntity<?> closeComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintClosureDTO dto,
            Authentication authentication
    ) {
        try {
            String closedBy = authentication.getName();
            Complaint updated = complaintService.closeComplaint(
                    id,
                    dto.getResolutionNotes(),
                    closedBy
            );
            
            log.info("Complaint {} closed by {}", id, closedBy);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error closing complaint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to close complaint: " + e.getMessage());
        }
    }

    /**
     * ✅ Add citizen feedback (rating + comment)
     */
    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> addFeedback(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintFeedbackDTO dto
    ) {
        try {
            Complaint updated = complaintService.addFeedback(
                    id,
                    dto.getRating(),
                    dto.getFeedback()
            );
            
            log.info("Feedback added to complaint {} - Rating: {}", id, dto.getRating());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error adding feedback", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    /**
     * ✅ Get overdue complaints (Admin dashboard)
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<Complaint>> getOverdueComplaints() {
        return ResponseEntity.ok(complaintService.getOverdueComplaints());
    }

    /**
     * ✅ Get complaints needing escalation
     */
    @GetMapping("/escalation-needed")
    public ResponseEntity<List<Complaint>> getComplaintsNeedingEscalation() {
        return ResponseEntity.ok(complaintService.getComplaintsNeedingEscalation());
    }
}
