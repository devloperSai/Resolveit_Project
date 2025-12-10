package com.resolveit.resloveitbackend.repository;
import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    // ========== EXISTING METHODS ==========
    List<Complaint> findByUser(User user);
    List<Complaint> findBySubmittedBy(String submittedBy);
    List<Complaint> findByAssignedTo(String assignedTo);
    List<Complaint> findByStatus(ComplaintStatus status);
    // ========== SLA QUERIES ==========
   
    @Query("SELECT c FROM Complaint c WHERE c.slaDue < :now AND c.status != 'RESOLVED'")
    List<Complaint> findOverdueComplaints(@Param("now") LocalDateTime now);
   
    default List<Complaint> findOverdueComplaints() {
        return findOverdueComplaints(LocalDateTime.now());
    }
   
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.slaDue < :now AND c.status != 'RESOLVED'")
    long countOverdueComplaints(@Param("now") LocalDateTime now);
   
    default long countOverdueComplaints() {
        return countOverdueComplaints(LocalDateTime.now());
    }
   
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = 'RESOLVED' AND c.closedAt <= c.slaDue")
    long countResolvedOnTime();
   
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = 'RESOLVED' AND c.closedAt > c.slaDue")
    long countResolvedLate();
   
    @Query("SELECT c FROM Complaint c WHERE c.escalationLevel < 3 AND c.slaDue < :now AND c.status != 'RESOLVED'")
    List<Complaint> findComplaintsNeedingEscalation(@Param("now") LocalDateTime now);
   
    // ========== ANALYTICS QUERIES (MISSING ONES) ==========
   
    @Query("SELECT c FROM Complaint c WHERE c.submittedAt BETWEEN :start AND :end")
    List<Complaint> findBySubmittedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Count complaints submitted between dates
     */
    long countBySubmittedAtBetween(LocalDateTime start, LocalDateTime end);
   
    @Query("SELECT c FROM Complaint c WHERE c.assignedTo = :officer AND c.status != 'RESOLVED'")
    List<Complaint> findActiveComplaintsByOfficer(@Param("officer") String officer);
   
    /**
     * ✅ Calculate average resolution time in hours
     * Uses TIMESTAMPDIFF to calculate hours between submission and closure
     */
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, c.submittedAt, c.closedAt)) FROM Complaint c WHERE c.status = 'RESOLVED' AND c.closedAt IS NOT NULL")
    Double findAverageResolutionTimeHours();
   
    /**
     * ✅ Get complaint count grouped by category
     * Returns Object[] where [0] = category name, [1] = count
     */
    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category ORDER BY COUNT(c) DESC")
    List<Object[]> findComplaintCountByCategory();
   
    /**
     * ✅ Get complaint count grouped by priority
     */
    @Query("SELECT c.priority, COUNT(c) FROM Complaint c GROUP BY c.priority")
    List<Object[]> findComplaintCountByPriority();
   
    /**
     * ✅ Get complaint count grouped by status
     */
    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> findComplaintCountByStatus();
   
    /**
     * ✅ Find complaints with high escalation level
     */
    @Query("SELECT c FROM Complaint c WHERE c.escalationLevel >= :level AND c.status != 'RESOLVED' ORDER BY c.escalationLevel DESC")
    List<Complaint> findHighlyEscalatedComplaints(@Param("level") int level);
   
    /**
     * ✅ Find unassigned complaints
     */
    @Query("SELECT c FROM Complaint c WHERE c.assignedTo IS NULL AND c.status = 'PENDING'")
    List<Complaint> findUnassignedComplaints();
   
    /**
     * ✅ Find complaints by rating (for feedback analysis)
     */
    @Query("SELECT c FROM Complaint c WHERE c.rating IS NOT NULL ORDER BY c.ratedAt DESC")
    List<Complaint> findComplaintsWithFeedback();
   
    /**
     * ✅ Calculate average rating
     */
    @Query("SELECT AVG(c.rating) FROM Complaint c WHERE c.rating IS NOT NULL")
    Double findAverageRating();
   
    /**
     * ✅ Find complaints due within next X hours
     */
    @Query("SELECT c FROM Complaint c WHERE c.slaDue BETWEEN :now AND :deadline AND c.status != 'RESOLVED' ORDER BY c.slaDue ASC")
    List<Complaint> findComplaintsDueSoon(@Param("now") LocalDateTime now, @Param("deadline") LocalDateTime deadline);
   
    default List<Complaint> findComplaintsDueInNextHours(int hours) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = now.plusHours(hours);
        return findComplaintsDueSoon(now, deadline);
    }

    /**
     * Find complaints submitted after a certain date
     */
    List<Complaint> findBySubmittedAtAfter(LocalDateTime dateTime);

    /**
     * Count complaints submitted after a certain date
     */
    long countBySubmittedAtAfter(LocalDateTime dateTime);
}