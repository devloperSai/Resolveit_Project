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
import com.resolveit.resloveitbackend.Model.ComplaintReply;
import com.resolveit.resloveitbackend.Model.ComplaintNote;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

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
     * Add a reply/update to a complaint (Officer/Admin/Citizen)
     */
    @PostMapping("/{id}/replies")
    public ResponseEntity<?> addReply(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            String content = body.get("content") != null ? body.get("content").toString() : null;
            boolean isAdminReply = body.get("isAdminReply") != null && Boolean.parseBoolean(body.get("isAdminReply").toString());
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }

            String createdBy = authentication != null ? authentication.getName() : (body.get("createdBy") != null ? body.get("createdBy").toString() : "unknown");

            ComplaintReply saved = complaintService.addReply(id, content.trim(), isAdminReply, createdBy);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error adding reply", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add reply: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/replies")
    public ResponseEntity<?> getReplies(@PathVariable Long id) {
        try {
            List<ComplaintReply> list = complaintService.getReplies(id);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Add an internal note to a complaint (Admin/Officer)
     */
    @PostMapping("/{id}/notes")
    public ResponseEntity<?> addNote(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            String content = body.get("content") != null ? body.get("content").toString() : null;
            boolean isPrivate = body.get("isPrivate") == null || Boolean.parseBoolean(body.get("isPrivate").toString());
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }

            String createdBy = authentication != null ? authentication.getName() : (body.get("createdBy") != null ? body.get("createdBy").toString() : "unknown");

            ComplaintNote saved = complaintService.addNote(id, content.trim(), isPrivate, createdBy);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error adding note", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add note: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<?> getNotes(@PathVariable Long id) {
        try {
            List<ComplaintNote> list = complaintService.getNotes(id);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
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

    /**
     * ✅ Download/View attachment file
     */
    @GetMapping("/attachments/{filename}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable String filename) {
        try {
            String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/complaints/";
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            
            // Security check: prevent directory traversal attacks
            Path uploadPath = Paths.get(UPLOAD_DIR).normalize();
            if (!filePath.startsWith(uploadPath)) {
                log.warn("Security violation: attempted directory traversal for {}", filename);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            if (!Files.exists(filePath)) {
                log.warn("Attachment not found: {} at path {}", filename, filePath.toString());
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.isReadable()) {
                log.error("Attachment not readable: {}", filename);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
            
            String contentType = "application/octet-stream";
            if (filename.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.toLowerCase().endsWith(".gif")) {
                contentType = "image/gif";
            }
            
            log.info("Serving attachment: {} with content type: {}", filename, contentType);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .header("Pragma", "no-cache")
                    .header("Expires", "0")
                    .body(resource);
        } catch (Exception e) {
            log.error("Error downloading attachment: {} - {}", filename, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
