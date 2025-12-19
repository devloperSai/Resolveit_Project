package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.ComplaintReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintReplyRepository extends JpaRepository<ComplaintReply, Long> {
    List<ComplaintReply> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
