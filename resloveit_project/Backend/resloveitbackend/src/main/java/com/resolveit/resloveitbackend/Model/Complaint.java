package com.resolveit.resloveitbackend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    // ========== STATUS & PRIORITY ==========
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status = ComplaintStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    // ========== ASSIGNMENT ==========
    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    // ========== SLA TRACKING ==========
    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "first_response_at")
    private LocalDateTime firstResponseAt;

    @Column(name = "sla_start")
    private LocalDateTime slaStart;

    @Column(name = "sla_due")
    private LocalDateTime slaDue;

    @Column(name = "response_sla_due")
    private LocalDateTime responseSladue;

    @Column(name = "escalation_level")
    private Integer escalationLevel = 0;

    @Column(name = "escalation_history", columnDefinition = "JSON")
    private String escalationHistory; // Store as JSON string

    // ========== NEW FIELDS FOR TWO-PHASE SLA ==========

    /**
     * Triage SLA - Admin must assign within 24hrs
     */
    @Column(name = "triage_sla_due")
    private LocalDateTime triageSlaDue;

    /**
     * Resolution SLA - Officer must resolve based on priority
     * (Only set AFTER admin assigns officer and sets priority)
     */
    @Column(name = "resolution_sla_due")
    private LocalDateTime resolutionSlaDue;

    /**
     * Tracks which SLA phase we're in
     */
    @Column(name = "sla_phase")
    private String slaPhase = "TRIAGE"; // TRIAGE | RESOLUTION

    /**
     * When priority was set by admin
     */
    @Column(name = "priority_set_at")
    private LocalDateTime prioritySetAt;

    /**
     * Flag if triage SLA was breached
     */
    @Column(name = "triage_breached")
    private Boolean triageBreached = false;

    // ========== AUDIT FIELDS ==========
    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version")
    private Integer version = 0;

    // ========== WORKFLOW ==========
    @Column(name = "workflow_state", length = 50)
    private String workflowState;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by")
    private String closedBy;

    // ========== CITIZEN FEEDBACK ==========
    @Column(name = "rating")
    private Integer rating; // 1-5 stars

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "rated_at")
    private LocalDateTime ratedAt;

    // ========== SUBMISSION INFO ==========
    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous = false;

    @Column(name = "submitted_by")
    private String submittedBy;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    // ========== LOCATION FIELDS ==========
    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    // ========== RELATIONSHIPS ==========
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "role", "createdAt", "hibernateLazyInitializer", "handler"})
    private User user;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "complaint_attachments", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "attachments")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    // ========== HELPER METHODS ==========

    /**
     * Check if complaint is overdue
     */
    public boolean isOverdue() {
        return slaDue != null &&
               LocalDateTime.now().isAfter(slaDue) &&
               status != ComplaintStatus.RESOLVED;
    }

    /**
     * Calculate hours until SLA breach
     */
    public Long getHoursUntilSlaBreach() {
        if (slaDue == null) return null;
        return java.time.Duration.between(LocalDateTime.now(), slaDue).toHours();
    }

    /**
     * Check if needs escalation
     */
    public boolean needsEscalation() {
        return isOverdue() && escalationLevel < 3;
    }

    /**
     * Get resolution time in hours
     */
    public Long getResolutionTimeHours() {
        if (closedAt == null || submittedAt == null) return null;
        return java.time.Duration.between(submittedAt, closedAt).toHours();
    }

    /**
     * Check if in triage phase and approaching deadline (9hrs remaining = 15hrs since submission)
     */
    public boolean isTriageCritical() {
        return "TRIAGE".equals(slaPhase) &&
               triageSlaDue != null &&
               LocalDateTime.now().plusHours(9).isAfter(triageSlaDue) &&
               status == ComplaintStatus.PENDING;
    }

    /**
     * Check if triage SLA breached
     */
    public boolean isTriageOverdue() {
        return "TRIAGE".equals(slaPhase) &&
               triageSlaDue != null &&
               LocalDateTime.now().isAfter(triageSlaDue) &&
               status == ComplaintStatus.PENDING;
    }

    /**
     * Get hours remaining in current SLA phase
     */
    public Long getHoursRemaining() {
        LocalDateTime deadline = "TRIAGE".equals(slaPhase) ? triageSlaDue : resolutionSlaDue;
        if (deadline == null) return null;
        return Duration.between(LocalDateTime.now(), deadline).toHours();
    }

    // ========== LIFECYCLE CALLBACKS ==========

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ComplaintStatus.PENDING;
        }
        if (this.priority == null) {
            this.priority = ComplaintPriority.MEDIUM;
        }
        if (this.escalationLevel == null) {
            this.escalationLevel = 0;
        }
        if (this.isAnonymous == null) {
            this.isAnonymous = false;
        }
        if (this.slaPhase == null) {
            this.slaPhase = "TRIAGE";
        }
        if (this.triageBreached == null) {
            this.triageBreached = false;
        }
        if (this.triageSlaDue == null) {
            this.triageSlaDue = this.submittedAt.plusHours(24);
        }
    }
}