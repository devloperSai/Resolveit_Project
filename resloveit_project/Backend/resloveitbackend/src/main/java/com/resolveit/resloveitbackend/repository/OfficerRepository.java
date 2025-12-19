package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, Long> {

    /**
     * Check if an officer exists by email (used during assignment validation)
     */
    boolean existsByEmail(String email);

    /**
     * Find officer by email - returns full officer object (name, department, etc.)
     * Used in AdminController for assignment and frontend dropdown
     */
    Optional<Officer> findByEmail(String email);

    /**
     * Optional: Find all officers (already available via findAll(), but explicit for clarity)
     */
    // List<Officer> findAll();  // Inherited from JpaRepository
}