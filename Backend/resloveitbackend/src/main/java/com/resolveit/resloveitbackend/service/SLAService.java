package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintPriority;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import lombok.Data;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SLAService {

    private final ComplaintRepository complaintRepository;

    @Value("${sla.triage.hours:24}")
    private int triageHours;

    @Value("${sla.triage.alert.hours:15}") // Alert 15hrs before breach (9hrs remaining)
    private int triageAlertHours;

    @Value("${sla.resolution.high:24}")
    private int resolutionHighPriority;

    @Value("${sla.resolution.medium:72}")
    private int resolutionMediumPriority;

    @Value("${sla.resolution.low:168}")
    private int resolutionLowPriority;

    @Value("${sla.response.high:2}")
    private int responseHighPriority;

    @Value("${sla.response.medium:8}")
    private int responseMediumPriority;

    @Value("${sla.response.low:24}")
    private int responseLowPriority;

    public SLAService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    // -------------------- Getter methods for controller/monitoring --------------------
    public int getSlaHighPriority() {
        return resolutionHighPriority;
    }

    public int getSlaMediumPriority() {
        return resolutionMediumPriority;
    }

    public int getSlaLowPriority() {
        return resolutionLowPriority;
    }

    public int getResponseHighPriority() {
        return responseHighPriority;
    }

    public int getResponseMediumPriority() {
        return responseMediumPriority;
    }

    public int getResponseLowPriority() {
        return responseLowPriority;
    }

    /**
     * Calculate SLA due time based on priority
     */
    public LocalDateTime calculateSlaDue(ComplaintPriority priority, LocalDateTime startTime) {
        int hours = switch (priority) {
            case HIGH -> resolutionHighPriority;
            case MEDIUM -> resolutionMediumPriority;
            case LOW -> resolutionLowPriority;
        };
        
        return startTime.plusHours(hours);
    }

    /**
     * Calculate response SLA (first response deadline)
     */
    public LocalDateTime calculateResponseSlaDue(ComplaintPriority priority, LocalDateTime startTime) {
        int hours = switch (priority) {
            case HIGH -> responseHighPriority;
            case MEDIUM -> responseMediumPriority;
            case LOW -> responseLowPriority;
        };
        
        return startTime.plusHours(hours);
    }

    /**
     * ✅ CORRECT: Initialize TRIAGE SLA on complaint submission
     */
    @Transactional
    public void initializeTriageSLA(Complaint complaint) {
        LocalDateTime now = LocalDateTime.now();
       
        complaint.setSlaStart(now);
        complaint.setTriageSlaDue(now.plusHours(triageHours)); // 24hrs fixed
        complaint.setSlaPhase("TRIAGE");
        complaint.setTriageBreached(false);
        complaint.setSlaDue(complaint.getTriageSlaDue()); // Set main SLA for compatibility
       
        log.info("✅ Triage SLA initialized for complaint {} - Due: {}",
                complaint.getId(), complaint.getTriageSlaDue());
    }

    /**
     * Set SLA timers when complaint is created
     */
    @Transactional
    public void initializeSLA(Complaint complaint) {
        initializeTriageSLA(complaint);
    }

    /**
     * Update SLA when priority changes
     */
    @Transactional
    public void recalculateSLA(Complaint complaint, ComplaintPriority newPriority) {
        if ("RESOLUTION".equals(complaint.getSlaPhase())) {
            LocalDateTime now = LocalDateTime.now();
            complaint.setPrioritySetAt(now);
            complaint.setResolutionSlaDue(calculateSlaDue(newPriority, now));
            complaint.setSlaDue(complaint.getResolutionSlaDue());
            complaint.setResponseSladue(calculateResponseSlaDue(newPriority, now));
            log.info("SLA recalculated for complaint {} after priority change to {}", 
                    complaint.getId(), newPriority);
        } else {
            // In triage, priority change doesn't affect SLA yet
            log.info("Priority changed for complaint {} in triage phase - no SLA impact", complaint.getId());
        }
    }

    /**
     * ✅ CORRECT: Transition to RESOLUTION SLA when admin assigns officer
     */
    @Transactional
    public void transitionToResolutionSLA(Complaint complaint, ComplaintPriority priority) {
        LocalDateTime now = LocalDateTime.now();
       
        // Check if triage was breached
        if (complaint.getTriageSlaDue() != null && now.isAfter(complaint.getTriageSlaDue())) {
            complaint.setTriageBreached(true);
            log.warn("⚠️ Complaint {} assigned AFTER triage breach", complaint.getId());
        }
       
        // Calculate resolution SLA based on priority
        int resolutionHours = switch (priority) {
            case HIGH -> resolutionHighPriority;
            case MEDIUM -> resolutionMediumPriority;
            case LOW -> resolutionLowPriority;
        };
       
        complaint.setSlaPhase("RESOLUTION");
        complaint.setResolutionSlaDue(now.plusHours(resolutionHours));
        complaint.setPrioritySetAt(now);
        complaint.setSlaDue(complaint.getResolutionSlaDue()); // Update main SLA field
        complaint.setResponseSladue(calculateResponseSlaDue(priority, now));
       
        log.info("✅ Complaint {} transitioned to RESOLUTION SLA - Priority: {}, Due: {}",
                complaint.getId(), priority, complaint.getResolutionSlaDue());
    }

    /**
     * Check if complaint needs escalation
     */
    public boolean needsEscalation(Complaint complaint) {
        return complaint.getSlaDue() != null &&
               LocalDateTime.now().isAfter(complaint.getSlaDue()) &&
               complaint.getStatus() != ComplaintStatus.RESOLVED &&
               complaint.getEscalationLevel() < 3;
    }

    /**
     * Escalate overdue complaints
     */
    @Transactional
    public int escalateOverdueComplaints() {
        List<Complaint> overdueComplaints = complaintRepository.findOverdueComplaints();
        int escalated = 0;

        for (Complaint complaint : overdueComplaints) {
            if (needsEscalation(complaint)) {
                escalateComplaint(complaint);
                escalated++;
            }
        }

        log.info("Escalated {} overdue complaints", escalated);
        return escalated;
    }

    /**
     * Escalate a single complaint
     */
    @Transactional
    public void escalateComplaint(Complaint complaint) {
        int currentLevel = complaint.getEscalationLevel();
        complaint.setEscalationLevel(currentLevel + 1);
        
        // Build escalation history JSON
        String escalationEntry = String.format(
            "{\"escalated_at\":\"%s\",\"level\":%d,\"reason\":\"SLA breach\"}",
            LocalDateTime.now(),
            currentLevel + 1
        );
        
        String history = complaint.getEscalationHistory();
        if (history == null || history.isEmpty() || history.equals("[]")) {
            complaint.setEscalationHistory("[" + escalationEntry + "]");
        } else {
            // Append to existing array
            complaint.setEscalationHistory(
                history.substring(0, history.length() - 1) + "," + escalationEntry + "]"
            );
        }
        
        complaintRepository.save(complaint);
        
        log.warn("Complaint {} escalated to level {}", 
                complaint.getId(), complaint.getEscalationLevel());
        
        // TODO: Send notification to higher authorities
    }

    /**
     * ✅ Get complaints needing triage alert (15hrs before breach = 9hrs remaining)
     */
    public List<Complaint> getTriageCriticalComplaints() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime alertThreshold = now.plusHours(9); // 9hrs remaining = alert
       
        return complaintRepository.findAll().stream()
                .filter(c -> "TRIAGE".equals(c.getSlaPhase()))
                .filter(c -> c.getStatus() == ComplaintStatus.PENDING)
                .filter(c -> c.getTriageSlaDue() != null)
                .filter(c -> c.getTriageSlaDue().isBefore(alertThreshold))
                .filter(c -> c.getTriageSlaDue().isAfter(now)) // Not yet breached
                .sorted((a, b) -> a.getTriageSlaDue().compareTo(b.getTriageSlaDue()))
                .collect(Collectors.toList());
    }
   
    /**
     * ✅ Get complaints with breached triage SLA
     */
    public List<Complaint> getTriageOverdueComplaints() {
        LocalDateTime now = LocalDateTime.now();
       
        return complaintRepository.findAll().stream()
                .filter(c -> "TRIAGE".equals(c.getSlaPhase()))
                .filter(c -> c.getStatus() == ComplaintStatus.PENDING)
                .filter(c -> c.getTriageSlaDue() != null)
                .filter(c -> now.isAfter(c.getTriageSlaDue()))
                .collect(Collectors.toList());
    }
   
    /**
     * ✅ Auto-escalate triage breaches
     */
    @Transactional
    public int escalateTriageBreaches() {
        List<Complaint> overdueComplaints = getTriageOverdueComplaints();
        int escalated = 0;
       
        for (Complaint complaint : overdueComplaints) {
            complaint.setTriageBreached(true);
            complaint.setEscalationLevel(1);
           
            // Build escalation history
            String escalationEntry = String.format(
                "{\"escalated_at\":\"%s\",\"level\":1,\"reason\":\"Triage SLA breach - no officer assigned\"}",
                LocalDateTime.now()
            );
            complaint.setEscalationHistory("[" + escalationEntry + "]");
           
            complaintRepository.save(complaint);
            escalated++;
           
            log.error("🚨 TRIAGE BREACH: Complaint {} not assigned within 24hrs", complaint.getId());
           
            // TODO: Send urgent notifications
            // emailService.notifyAdminTriageBreach(complaint);
            // smsService.alertManagement(complaint);
        }
       
        log.warn("🚨 Escalated {} complaints for triage SLA breach", escalated);
        return escalated;
    }
   
    /**
     * ✅ Scheduled job - runs every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkTriageBreaches() {
        log.info("🔍 Checking for triage SLA breaches...");
        escalateTriageBreaches();
    }

    /**
     * Get SLA metrics
     */
    public SLAMetrics getSLAMetrics() {
        long total = complaintRepository.count();
        long overdue = complaintRepository.countOverdueComplaints();
        long resolvedOnTime = complaintRepository.countResolvedOnTime();
        long resolvedLate = complaintRepository.countResolvedLate();
        
        double complianceRate = total > 0 ? 
            ((double) resolvedOnTime / (resolvedOnTime + resolvedLate)) * 100 : 0;
        
        return SLAMetrics.builder()
            .totalComplaints(total)
            .overdueComplaints(overdue)
            .resolvedOnTime(resolvedOnTime)
            .resolvedLate(resolvedLate)
            .slaComplianceRate(complianceRate)
            .build();
    }

    @Data
    @Builder
    public static class SLAMetrics {
        private Long totalComplaints;
        private Long overdueComplaints;
        private Long resolvedOnTime;
        private Long resolvedLate;
        private Double slaComplianceRate;
    }
}