package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    /**
     * Find all complaints submitted by a specific citizen (User entity)
     */
    List<Complaint> findByUser(User user);

    /**
     * Backup: Find complaints by submittedBy email (in case User is null)
     */
    List<Complaint> findBySubmittedBy(String submittedBy);

    /**
     * Find all complaints assigned to a specific officer by email
     */
    List<Complaint> findByAssignedTo(String assignedTo);

    /**
     * Corrected: Find complaints by status using Enum (not String)
     */
    List<Complaint> findByStatus(ComplaintStatus status);
}
