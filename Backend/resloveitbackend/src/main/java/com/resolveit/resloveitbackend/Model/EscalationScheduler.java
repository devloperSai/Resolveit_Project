package com.resolveit.resloveitbackend.Model;

import com.resolveit.resloveitbackend.service.SLAService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@ConditionalOnProperty(value = "escalation.enabled", havingValue = "true", matchIfMissing = true)
public class EscalationScheduler {

    private final SLAService slaService;

    public EscalationScheduler(SLAService slaService) {
        this.slaService = slaService;
    }

    /**
     * Run every hour to check for overdue complaints
     * Cron: 0 0 * * * * = Every hour at minute 0
     */
    @Scheduled(cron = "${escalation.check.cron:0 0 * * * *}")
    public void escalateOverdueComplaints() {
        log.info("Starting escalation check for overdue complaints");
        
        try {
            int escalated = slaService.escalateOverdueComplaints();
            log.info("Escalation check completed - {} complaints escalated", escalated);
        } catch (Exception e) {
            log.error("Error during escalation check", e);
        }
    }

    /**
     * Generate daily SLA report (runs at 9 AM every day)
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void generateDailySLAReport() {
        log.info("Generating daily SLA report");
        
        try {
            SLAService.SLAMetrics metrics = slaService.getSLAMetrics();
            log.info("Daily SLA Report: Total={}, Overdue={}, Compliance={}%", 
                    metrics.getTotalComplaints(), 
                    metrics.getOverdueComplaints(),
                    metrics.getSlaComplianceRate());
            
            // TODO: Send email report to admins
        } catch (Exception e) {
            log.error("Error generating SLA report", e);
        }
    }
}