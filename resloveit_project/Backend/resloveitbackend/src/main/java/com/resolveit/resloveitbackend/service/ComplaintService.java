package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.dto.ComplaintRequest;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import com.resolveit.resloveitbackend.repository.ComplaintReplyRepository;
import com.resolveit.resloveitbackend.repository.ComplaintNoteRepository;
import com.resolveit.resloveitbackend.service.ReportService;
import com.resolveit.resloveitbackend.service.SLAService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ComplaintService {
   
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final SLAService slaService;
    private final ReportService reportService;
    private final ComplaintReplyRepository complaintReplyRepository;
    private final ComplaintNoteRepository complaintNoteRepository;
    // File upload directory
    private static final String UPLOAD_DIR =
            System.getProperty("user.dir") + "/uploads/complaints/";
    public ComplaintService(ComplaintRepository complaintRepository,
                            UserRepository userRepository,
                            SLAService slaService,
                            ReportService reportService,
                            ComplaintReplyRepository complaintReplyRepository,
                            ComplaintNoteRepository complaintNoteRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.slaService = slaService;
        this.reportService = reportService;
        this.complaintReplyRepository = complaintReplyRepository;
        this.complaintNoteRepository = complaintNoteRepository;
        // Ensure upload directory exists
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            boolean created = uploadDir.mkdirs();
            if (!created) {
                log.warn("Could not create upload directory: {}", UPLOAD_DIR);
            }
        }
    }
    /**
     * ✅ CORRECT: Submit complaint with TRIAGE SLA only
     */
    @Transactional
    public Complaint submitComplaint(ComplaintRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        Complaint complaint = Complaint.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .isAnonymous(request.getIsAnonymous())
                .status(ComplaintStatus.PENDING)
                .priority(ComplaintPriority.MEDIUM) // ⚠️ Placeholder, NOT used for SLA yet
                .submittedBy(email)
                .createdBy(email)
                .user(user)
                .submittedAt(LocalDateTime.now())
                .escalationLevel(0)
                .build();
        // ✅ Set TRIAGE SLA (24hrs fixed, no priority needed)
        slaService.initializeTriageSLA(complaint);
        Complaint saved = complaintRepository.save(complaint);
        log.info("✅ Complaint {} submitted - Triage due: {}",
                saved.getId(), saved.getTriageSlaDue());
        return saved;
    }
    /**
     * NEW: Submit complaint with files + location (multipart flow)
     * Mirrors your old logic but also initializes SLA.
     */
    @Transactional
    public Complaint submitComplaintWithFiles(
            String email,
            String title,
            String description,
            String category,
            Boolean isAnonymous,
            String address,
            String city,
            String state,
            String pincode,
            Double latitude,
            Double longitude,
            MultipartFile[] files
    ) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        Complaint complaint = new Complaint();
        complaint.setTitle(title);
        complaint.setDescription(description);
        complaint.setCategory(category);
        complaint.setIsAnonymous(isAnonymous != null ? isAnonymous : false);
        complaint.setUser(user);
        complaint.setSubmittedBy(email);
        complaint.setCreatedBy(email);
        complaint.setStatus(ComplaintStatus.PENDING);
        complaint.setPriority(ComplaintPriority.MEDIUM);
        complaint.setSubmittedAt(LocalDateTime.now());
        complaint.setEscalationLevel(0);
        // Location data
        complaint.setAddress(address);
        complaint.setCity(city);
        complaint.setState(state);
        complaint.setPincode(pincode);
        complaint.setLatitude(latitude != null ? new java.math.BigDecimal(latitude) : null);
        complaint.setLongitude(longitude != null ? new java.math.BigDecimal(longitude) : null);
        // Handle file uploads
        if (files != null && files.length > 0) {
            List<String> filePaths = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String originalFilename = file.getOriginalFilename();
                    String extension = (originalFilename != null && originalFilename.contains("."))
                            ? originalFilename.substring(originalFilename.lastIndexOf("."))
                            : "";
                    String filename = UUID.randomUUID().toString() + extension;
                    Path filePath = Paths.get(UPLOAD_DIR + filename);
                    Files.write(filePath, file.getBytes());
                    filePaths.add(filename);
                }
            }
            if (!filePaths.isEmpty()) {
                complaint.setAttachments(filePaths);
            }
        }
        // Initialize SLA as well for file-based complaints
        slaService.initializeTriageSLA(complaint);
        Complaint saved = complaintRepository.save(complaint);
        log.info("✅ Complaint {} (multipart) submitted - Triage due: {}",
                saved.getId(), saved.getTriageSlaDue());
        return saved;
    }
    /**
     * OPTIONAL LEGACY SUPPORT:
     * Keep old signature submitComplaint(Complaint, String) in case something still calls it.
     */
    @Transactional
    public Complaint submitComplaint(Complaint complaint, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        complaint.setUser(user);
        complaint.setSubmittedBy(email);
        complaint.setCreatedBy(email);
        if (complaint.getStatus() == null) {
            complaint.setStatus(ComplaintStatus.PENDING);
        }
        if (complaint.getPriority() == null) {
            complaint.setPriority(ComplaintPriority.MEDIUM);
        }
        if (complaint.getSubmittedAt() == null) {
            complaint.setSubmittedAt(LocalDateTime.now());
        }
        if (complaint.getEscalationLevel() == null) {
            complaint.setEscalationLevel(0);
        }
        slaService.initializeTriageSLA(complaint);
        Complaint saved = complaintRepository.save(complaint);
        log.info("✅ Complaint {} (legacy submit) submitted - Triage due: {}",
                saved.getId(), saved.getTriageSlaDue());
        return saved;
    }
    /**
     * Update complaint priority and recalculate SLA
     */
    @Transactional
    public Complaint updatePriority(Long id, ComplaintPriority priority, String updatedBy) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        ComplaintPriority oldPriority = complaint.getPriority();
        complaint.setPriority(priority);
        complaint.setUpdatedBy(updatedBy);
        // Recalculate SLA if priority changed
        if (oldPriority != priority) {
            slaService.recalculateSLA(complaint, priority);
            log.info("Complaint {} priority changed from {} to {} by {}",
                    id, oldPriority, priority, updatedBy);
        }
        return complaintRepository.save(complaint);
    }
    /**
     * Update complaint status
     */
    @Transactional
    public Complaint updateStatus(Long id, ComplaintStatus status, String updatedBy) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        // 🔒 CRITICAL: Enforce report requirement
        if (status == ComplaintStatus.RESOLVED) {
            boolean hasReport = reportService.hasReport(id);
            if (!hasReport) {
                throw new RuntimeException(
                        "Cannot resolve complaint without submitting a report. " +
                        "Please submit a report first."
                );
            }
        }
        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(status);
        complaint.setUpdatedBy(updatedBy);
        switch (status) {
            case ASSIGNED:
                if (complaint.getAssignedAt() == null) {
                    complaint.setAssignedAt(LocalDateTime.now());
                }
                break;
            case IN_PROGRESS:
                if (complaint.getAcknowledgedAt() == null) {
                    complaint.setAcknowledgedAt(LocalDateTime.now());
                }
                break;
            case RESOLVED:
                complaint.setClosedAt(LocalDateTime.now());
                complaint.setClosedBy(updatedBy);
                break;
            default:
                break;
        }
        log.info("Complaint {} status changed from {} to {} by {}",
                id, oldStatus, status, updatedBy);
        return complaintRepository.save(complaint);
    }
    /**
     * ✅ CORRECT: Assign officer + set priority → Transition to RESOLUTION SLA
     */
    @Transactional
    public Complaint assignComplaintWithPriority(Long id, String officerEmail,
                                                 ComplaintPriority priority, String assignedBy) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        // Update assignment
        complaint.setAssignedTo(officerEmail);
        complaint.setAssignedAt(LocalDateTime.now());
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setPriority(priority); // ✅ NOW priority is actually set
        complaint.setUpdatedBy(assignedBy);
       
        // ✅ Transition from TRIAGE to RESOLUTION SLA
        slaService.transitionToResolutionSLA(complaint, priority);
        log.info("✅ Complaint {} assigned to {} with priority {} - Resolution due: {}",
                id, officerEmail, priority, complaint.getResolutionSlaDue());
        return complaintRepository.save(complaint);
    }
    /**
     * Assign complaint to officer
     */
    @Transactional
    public Complaint assignComplaint(Long id, String officerEmail, String assignedBy) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        complaint.setAssignedTo(officerEmail);
        complaint.setAssignedAt(LocalDateTime.now());
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setUpdatedBy(assignedBy);
        log.info("Complaint {} assigned to {} by {}", id, officerEmail, assignedBy);
        return complaintRepository.save(complaint);
    }
    /**
     * Close complaint with resolution notes
     */
    @Transactional
    public Complaint closeComplaint(Long id, String resolutionNotes, String closedBy) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolutionNotes(resolutionNotes);
        complaint.setClosedAt(LocalDateTime.now());
        complaint.setClosedBy(closedBy);
        complaint.setUpdatedBy(closedBy);
        log.info("Complaint {} closed by {} - Resolution time: {} hours",
                id, closedBy, complaint.getResolutionTimeHours());
        return complaintRepository.save(complaint);
    }
    /**
     * Add citizen feedback
     */
    @Transactional
    public Complaint addFeedback(Long id, Integer rating, String feedback) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new RuntimeException("Can only rate resolved complaints");
        }
        complaint.setRating(rating);
        complaint.setFeedback(feedback);
        complaint.setRatedAt(LocalDateTime.now());
        log.info("Complaint {} rated {} stars", id, rating);
        return complaintRepository.save(complaint);
    }
    // ========== EXISTING METHODS ==========
    public List<Complaint> getUserComplaints(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return complaintRepository.findByUser(user);
    }
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }
    public List<Complaint> getOverdueComplaints() {
        return complaintRepository.findOverdueComplaints();
    }
    /**
     * Get complaint by ID
     */
    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
    }
    /**
     * Get complaints needing escalation
     */
    public List<Complaint> getComplaintsNeedingEscalation() {
        List<Complaint> list = complaintRepository.findComplaintsNeedingEscalation(LocalDateTime.now());
        log.info("Found {} complaints needing escalation as of {}", list.size(), LocalDateTime.now());
        return list;
    }

    // ========== Replies & Notes handling ==========
    @Transactional
    public com.resolveit.resloveitbackend.Model.ComplaintReply addReply(Long complaintId, String content, boolean isAdminReply, String createdBy) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));

        com.resolveit.resloveitbackend.Model.ComplaintReply reply = com.resolveit.resloveitbackend.Model.ComplaintReply.builder()
                .complaint(complaint)
                .content(content)
                .isAdminReply(isAdminReply)
                .createdBy(createdBy)
                .build();

        com.resolveit.resloveitbackend.Model.ComplaintReply saved = complaintReplyRepository.save(reply);

        // Update first response time for complaint if applicable
        if (!isAdminReply && complaint.getFirstResponseAt() == null) {
            complaint.setFirstResponseAt(java.time.LocalDateTime.now());
            complaintRepository.save(complaint);
        }

        return saved;
    }

    public List<com.resolveit.resloveitbackend.Model.ComplaintReply> getReplies(Long complaintId) {
        return complaintReplyRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }

    @Transactional
    public com.resolveit.resloveitbackend.Model.ComplaintNote addNote(Long complaintId, String content, boolean isPrivate, String createdBy) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));

        com.resolveit.resloveitbackend.Model.ComplaintNote note = com.resolveit.resloveitbackend.Model.ComplaintNote.builder()
                .complaint(complaint)
                .content(content)
                .isPrivate(isPrivate)
                .createdBy(createdBy)
                .build();

        return complaintNoteRepository.save(note);
    }

    public List<com.resolveit.resloveitbackend.Model.ComplaintNote> getNotes(Long complaintId) {
        return complaintNoteRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }
}