package com.resolveit.resloveitbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintClosureDTO {
    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;
    
    @NotBlank(message = "Closed by is required")
    private String closedBy;
}