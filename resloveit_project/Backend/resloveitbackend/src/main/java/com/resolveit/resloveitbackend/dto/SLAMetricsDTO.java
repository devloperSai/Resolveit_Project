package com.resolveit.resloveitbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SLAMetricsDTO {
    private Long totalComplaints;
    private Long overdueComplaints;
    private Long resolvedOnTime;
    private Long resolvedLate;
    private Double slaComplianceRate; // Percentage
    private Double avgResolutionHours;
    private Long highPriorityOverdue;
    private Long mediumPriorityOverdue;
    private Long lowPriorityOverdue;
}