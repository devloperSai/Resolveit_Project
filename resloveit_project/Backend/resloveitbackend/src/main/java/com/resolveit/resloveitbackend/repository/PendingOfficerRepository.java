package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.PendingOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PendingOfficerRepository extends JpaRepository<PendingOfficer, Long> {
    Optional<PendingOfficer> findByEmail(String email);
}
