package com.resolveit.resloveitbackend.repository;
import com.resolveit.resloveitbackend.Model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    Optional<Report> findByComplaintId(Long complaintId);
   
    boolean existsByComplaintId(Long complaintId);
   
    List<Report> findByOfficerEmail(String officerEmail);
   
    List<Report> findByStatus(Report.ReportStatus status);
    
    /**
     * Count reports by status
     */
    long countByStatus(Report.ReportStatus status);
   
    @Query("SELECT r FROM Report r WHERE r.submittedAt BETWEEN :start AND :end")
    List<Report> findBySubmittedAtBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
   
    long countByOfficerEmail(String officerEmail);
   
    @Query("SELECT r FROM Report r WHERE r.status = 'SUBMITTED' ORDER BY r.submittedAt ASC")
    List<Report> findPendingReview();
   
    @Query("SELECT r.officerEmail, COUNT(r), AVG(r.completionTimeHours) " +
           "FROM Report r " +
           "WHERE r.submittedAt >= :since " +
           "GROUP BY r.officerEmail")
    List<Object[]> getOfficerMetrics(@Param("since") LocalDateTime since);
}