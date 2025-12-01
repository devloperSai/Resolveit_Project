package com.resolveit.resloveitbackend.controller;
import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.dto.ComplaintRequest;
import com.resolveit.resloveitbackend.dto.PriorityUpdateDto;
import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
public class ComplaintController {
    @Autowired
    private ComplaintService complaintService;
    /**
     * ✅ Citizen submits a new complaint.
     * Example POST: /api/complaints/submit?email=citizen@example.com
     */
    @PostMapping("/submit")
    public Complaint submitComplaint(
            @RequestBody ComplaintRequest request,
            @RequestParam String email
    ) {
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setIsAnonymous(request.getIsAnonymous());
        return complaintService.submitComplaint(complaint, email);
    }
    /**
     * ✅ Citizen views all their complaints.
     * Example GET: /api/complaints/user?email=citizen@example.com
     */
    @GetMapping("/user")
    public List<Complaint> getUserComplaints(@RequestParam String email) {
        return complaintService.getUserComplaints(email);
    }
    /**
     * ✅ Admin (and optionally officers) can view all complaints.
     * Example GET: /api/complaints
     */
    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintService.getAllComplaints();
    }
    /**
     * PUT endpoint to update complaint priority.
     * Example: PUT /api/complaints/123/priority  with body: { "priority": "HIGH" }
     *
     * Note: this method expects a PriorityUpdateDto in the request body (you can provide a simple DTO
     * with a single String field "priority"). The controller converts the incoming value to the
     * ComplaintPriority enum and delegates to the service.
     */
    @PutMapping("/{id}/priority")
    public Complaint updatePriority(
            @PathVariable Long id,
            @RequestBody PriorityUpdateDto dto
    ) {
        if (dto == null || dto.getPriority() == null) {
            throw new IllegalArgumentException("priority must be provided");
        }
        ComplaintPriority priority;
        try {
            priority = ComplaintPriority.valueOf(dto.getPriority().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid priority value. Allowed: LOW, MEDIUM, HIGH");
        }
        return complaintService.updatePriority(id, priority);
    }

    /**
     * ✅ Officer/Admin updates complaint status.
     * Example PATCH: /api/complaints/1/status with body: { "status": "IN_PROGRESS" }
     */
    @PatchMapping("/{id}/status")
    public Complaint updateComplaintStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate
    ) {
        String newStatus = statusUpdate.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("status must be provided");
        }
        return complaintService.updateComplaintStatus(id, newStatus);
    }
}