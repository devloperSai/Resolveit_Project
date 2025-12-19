package com.resolveit.resloveitbackend.service;
import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.Report;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.ReportRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
@Service
@Slf4j
public class ReportService {
    private final ReportRepository reportRepository;
    private final ComplaintRepository complaintRepository;
    private static final String REPORT_UPLOAD_DIR =
            System.getProperty("user.dir") + "/uploads/reports/";
    public ReportService(ReportRepository reportRepository,
                         ComplaintRepository complaintRepository) {
        this.reportRepository = reportRepository;
        this.complaintRepository = complaintRepository;
        // Ensure directory exists
        try {
            Files.createDirectories(Paths.get(REPORT_UPLOAD_DIR));
        } catch (IOException e) {
            log.error("Failed to create report upload directory", e);
        }
    }
    @Transactional
    public Report submitReport(
            Long complaintId,
            String officerEmail,
            String officerName,
            String actionTaken,
            String description,
            String recommendations,
            MultipartFile[] files
    ) throws IOException {
       
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + complaintId));
        if (!officerEmail.equals(complaint.getAssignedTo())) {
            throw new RuntimeException("You are not assigned to this complaint");
        }
        if (reportRepository.existsByComplaintId(complaintId)) {
            throw new RuntimeException("Report already exists for this complaint");
        }
        List<String> filePaths = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String filename = UUID.randomUUID().toString() +
                            getFileExtension(file.getOriginalFilename());
                    Path path = Paths.get(REPORT_UPLOAD_DIR + filename);
                    Files.write(path, file.getBytes());
                    filePaths.add(filename);
                }
            }
        }
        Long completionHours = null;
        if (complaint.getSubmittedAt() != null) {
            completionHours = Duration.between(
                    complaint.getSubmittedAt(),
                    LocalDateTime.now()
            ).toHours();
        }
        Report report = Report.builder()
                .complaintId(complaintId)
                .officerEmail(officerEmail)
                .officerName(officerName)
                .actionTaken(actionTaken)
                .description(description)
                .recommendations(recommendations)
                .attachments(filePaths)
                .status(Report.ReportStatus.SUBMITTED.toString())
                .completionTimeHours(completionHours)
                .citizenNotified(false)
                .build();
        Report saved = reportRepository.save(report);
        log.info("Report {} submitted by {} for complaint {}",
                saved.getId(), officerEmail, complaintId);
        return saved;
    }
    @Transactional
    public Report updateReport(
            Long reportId,
            String actionTaken,
            String description,
            String recommendations
    ) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        if (!report.getStatus().equals(Report.ReportStatus.DRAFT.toString())) {
            throw new RuntimeException("Can only update draft reports");
        }
        report.setActionTaken(actionTaken);
        report.setDescription(description);
        report.setRecommendations(recommendations);
        return reportRepository.save(report);
    }
    public Report getReportByComplaintId(Long complaintId) {
        return reportRepository.findByComplaintId(complaintId)
                .orElse(null);
    }
    public boolean hasReport(Long complaintId) {
        return reportRepository.existsByComplaintId(complaintId);
    }
    @Transactional
    public Report approveReport(Long reportId, String reviewedBy, String notes) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(Report.ReportStatus.APPROVED.toString());
        report.setReviewedBy(reviewedBy);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewNotes(notes);
        log.info("Report {} approved by {}", reportId, reviewedBy);
        return reportRepository.save(report);
    }
    @Transactional
    public Report rejectReport(Long reportId, String reviewedBy, String notes) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(Report.ReportStatus.REJECTED.toString());
        report.setReviewedBy(reviewedBy);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewNotes(notes);
        log.info("Report {} rejected by {}", reportId, reviewedBy);
        return reportRepository.save(report);
    }
    public List<Report> getOfficerReports(String officerEmail) {
        return reportRepository.findByOfficerEmail(officerEmail);
    }
    public List<Report> getPendingReports() {
        return reportRepository.findPendingReview();
    }
    /**
     * Get all reports
     */
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }
    /**
     * Get total report count
     */
    public long getTotalReportCount() {
        return reportRepository.count();
    }
    /**
     * Get pending report count
     */
    public long getPendingReportCount() {
        return reportRepository.countByStatus(Report.ReportStatus.SUBMITTED);
    }
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}