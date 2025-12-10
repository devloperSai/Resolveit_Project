package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.PendingOfficer;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.PendingOfficerRepository;
import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Better than empty @CrossOrigin
public class AdminController {

    @Autowired
    private PendingOfficerRepository pendingRepo;

    @Autowired
    private OfficerRepository officerRepo;

    @Autowired
    private ComplaintRepository complaintRepository; // Required for assignment

    @Autowired
    private ComplaintService complaintService;

    // === EXISTING: Approve Officer ===
    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approveOfficer(@PathVariable Long id) {
        PendingOfficer pending = pendingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Pending officer not found"));

        pending.setApproved(true);

        Officer newOfficer = Officer.builder()
                .name(pending.getName())
                .email(pending.getEmail())
                .password(pending.getPassword())
                .department(pending.getDepartment())
                .build();

        officerRepo.save(newOfficer);
        pendingRepo.delete(pending);
        return ResponseEntity.ok("Officer approved successfully.");
    }

    // === EXISTING: Reject Officer ===
    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectOfficer(@PathVariable Long id) {
        pendingRepo.deleteById(id);
        return ResponseEntity.ok("Officer request rejected.");
    }

    // === NEW: Assign Officer to Complaint ===
    @PostMapping("/complaints/{complaintId}/assign")
    public ResponseEntity<?> assignOfficerWithPriority(
            @PathVariable Long complaintId,
            @RequestBody Map<String, String> request) {
        String officerEmail = request.get("officerEmail");
        String priorityStr = request.get("priority"); // "HIGH", "MEDIUM", "LOW"
        if (officerEmail == null || priorityStr == null) {
            return ResponseEntity.badRequest()
                    .body("Both officerEmail and priority are required");
        }
        try {
            ComplaintPriority priority = ComplaintPriority.valueOf(priorityStr.toUpperCase());
           
            Complaint updated = complaintService.assignComplaintWithPriority(
                    complaintId,
                    officerEmail,
                    priority,
                    "admin" // or get from auth
            );
           
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid priority. Use: HIGH, MEDIUM, LOW");
        }
    }
}