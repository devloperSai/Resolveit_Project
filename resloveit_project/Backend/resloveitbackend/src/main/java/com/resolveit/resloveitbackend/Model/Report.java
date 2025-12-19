package com.resolveit.resloveitbackend.Model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "complaint_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long complaintId;
    @Column(nullable = false)
    private String officerEmail;
    @Column(nullable = false)
    private String officerName;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String actionTaken;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String recommendations;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_attachments", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "file_path")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();
    @Column(nullable = false, length = 50)
    private String status = "SUBMITTED";
    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @Column(name = "reviewed_by")
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;
    // Metadata
    @Column(name = "completion_time_hours")
    private Long completionTimeHours;
    @Column(name = "citizen_notified")
    private Boolean citizenNotified = false;
    public enum ReportStatus {
        DRAFT,
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED
    }
    public ReportStatus getStatusEnum() {
        return ReportStatus.valueOf(this.status);
    }
    public void setStatusEnum(ReportStatus status) {
        this.status = status.name();
    }
    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = "SUBMITTED";
        }
        if (this.citizenNotified == null) {
            this.citizenNotified = false;
        }
    }
}