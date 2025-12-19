package com.resolveit.resloveitbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComplaintAssignmentDTO {
    @NotNull(message = "Complaint ID is required")
    private Long complaintId;
    
    @NotBlank(message = "Officer email is required")
    @Email(message = "Invalid officer email")
    private String officerEmail;
    
    @NotBlank(message = "Assigned by is required")
    private String assignedBy;
    
    private Integer slaHours; // Optional - will use default based on priority if not provided
}