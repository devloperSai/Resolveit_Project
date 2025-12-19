package com.resolveit.resloveitbackend.dto;

import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String category;
    private ComplaintStatus status;
    private ComplaintPriority priority;
    
    // Assignment info
    private String assignedTo;
    private LocalDateTime assignedAt;
    
    // SLA info
    private LocalDateTime slaDue;
    private LocalDateTime responseSladue;
    private Boolean isOverdue;
    private Long hoursUntilBreach;
    private Integer escalationLevel;
    
    // Submission info
    private String submittedBy;
    private LocalDateTime submittedAt;
    private Boolean isAnonymous;
    
    // Resolution info
    private String resolutionNotes;
    private LocalDateTime closedAt;
    private Long resolutionTimeHours;
    
    // Feedback
    private Integer rating;
    private String feedback;
    
    // Audit
    private LocalDateTime updatedAt;
    private String updatedBy;
    
    // Attachments
    private List<String> attachments;
    
    // Citizen info (from User)
    private String citizenName;
    private String citizenEmail;
}