package com.resolveit.resloveitbackend.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "officer")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Officer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // hashed

    @Column(nullable = false)
    private String department;

    // ✅ ADDED: role column for Spring Security
    @Column(name = "role", nullable = false, length = 50)
    private String role = "ROLE_OFFICER";  // Default role

    // ✅ Lombok @Data already generates getRole() and setRole()
    // If you want explicit (optional):
    // public String getRole() { return role; }
    // public void setRole(String role) { this.role = role; }
}