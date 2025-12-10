package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final SLAService slaService;

    public AnalyticsService(ComplaintRepository complaintRepository, SLAService slaService) {
        this.complaintRepository = complaintRepository;
        this.slaService = slaService;
    }

    /**
     * Get comprehensive dashboard statistics
     */
    public Map<String, Object> getDashboardStatistics() {
        List<Complaint> allComplaints = complaintRepository.findAll();
        
        long total = allComplaints.size();
        long pending = allComplaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.PENDING)
                .count();
        long assigned = allComplaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.ASSIGNED)
                .count();
        long inProgress = allComplaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS)
                .count();
        long resolved = allComplaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED)
                .count();
        long overdue = complaintRepository.countOverdueComplaints();
        
        long highPriority = allComplaints.stream()
                .filter(c -> c.getPriority() == ComplaintPriority.HIGH)
                .count();
        
        Double avgResolutionHours = complaintRepository.findAverageResolutionTimeHours();
        
        SLAService.SLAMetrics slaMetrics = slaService.getSLAMetrics();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("assigned", assigned);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);
        stats.put("overdue", overdue);
        stats.put("highPriority", highPriority);
        stats.put("avgResolutionHours", avgResolutionHours != null ? Math.round(avgResolutionHours * 10) / 10.0 : 0);
        stats.put("slaCompliance", slaMetrics.getSlaComplianceRate());
        
        return stats;
    }

    /**
     * Get category distribution
     */
    public List<Map<String, Object>> getCategoryDistribution() {
        List<Object[]> results = complaintRepository.findComplaintCountByCategory();
        
        return results.stream()
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("category", row[0]);
                    item.put("count", row[1]);
                    return item;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get priority distribution
     */
    public Map<String, Long> getPriorityDistribution() {
        List<Complaint> complaints = complaintRepository.findAll();
        
        return complaints.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getPriority().name(),
                        Collectors.counting()
                ));
    }

    /**
     * Get officer workload statistics
     */
    public List<Map<String, Object>> getOfficerWorkload() {
        List<Complaint> assignedComplaints = complaintRepository.findAll().stream()
                .filter(c -> c.getAssignedTo() != null)
                .collect(Collectors.toList());

        Map<String, List<Complaint>> byOfficer = assignedComplaints.stream()
                .collect(Collectors.groupingBy(Complaint::getAssignedTo));

        return byOfficer.entrySet().stream()
                .map(entry -> {
                    String officer = entry.getKey();
                    List<Complaint> complaints = entry.getValue();
                    
                    Map<String, Object> workload = new HashMap<>();
                    workload.put("officer", officer);
                    workload.put("total", complaints.size());
                    workload.put("assigned", complaints.stream()
                            .filter(c -> c.getStatus() == ComplaintStatus.ASSIGNED)
                            .count());
                    workload.put("inProgress", complaints.stream()
                            .filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS)
                            .count());
                    workload.put("resolved", complaints.stream()
                            .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED)
                            .count());
                    workload.put("overdue", complaints.stream()
                            .filter(Complaint::isOverdue)
                            .count());
                    
                    return workload;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get trend data for last N days
     */
    public List<Map<String, Object>> getTrendData(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Complaint> complaints = complaintRepository.findBySubmittedAtBetween(
                startDate, 
                LocalDateTime.now()
        );

        Map<LocalDate, List<Complaint>> byDate = complaints.stream()
                .collect(Collectors.groupingBy(c -> c.getSubmittedAt().toLocalDate()));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<Complaint> dayComplaints = entry.getValue();
                    
                    Map<String, Object> dayData = new HashMap<>();
                    dayData.put("date", date.toString());
                    dayData.put("submitted", dayComplaints.size());
                    dayData.put("resolved", dayComplaints.stream()
                            .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED)
                            .count());
                    dayData.put("high_priority", dayComplaints.stream()
                            .filter(c -> c.getPriority() == ComplaintPriority.HIGH)
                            .count());
                    
                    return dayData;
                })
                .collect(Collectors.toList());
    }
}