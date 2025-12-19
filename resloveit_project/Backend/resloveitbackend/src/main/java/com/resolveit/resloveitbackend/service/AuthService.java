package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.dto.*;
import com.resolveit.resloveitbackend.Model.*;
import com.resolveit.resloveitbackend.repository.*;
import com.resolveit.resloveitbackend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;
    private final PendingOfficerRepository pendingOfficerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       OfficerRepository officerRepository,
                       PendingOfficerRepository pendingOfficerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
        this.pendingOfficerRepository = pendingOfficerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * ✅ Unified login logic for Admin, Citizen, and Officer
     */
    public AuthResponse login(String email, String rawPassword) {
        // 🔹 Step 1: Try finding the user in "users" table (Citizen/Admin/Legacy Officer)
        Optional<User> optionalUser = userRepository.findByEmail(email);

        // 🔹 Step 2: If not found, check "officer" table
        if (optionalUser.isEmpty()) {
            Optional<Officer> officerOpt = officerRepository.findByEmail(email);
            if (officerOpt.isPresent()) {
                Officer officer = officerOpt.get();

                if (!passwordEncoder.matches(rawPassword, officer.getPassword())) {
                    throw new RuntimeException("Invalid password. Please try again.");
                }

                // Officer found and approved -> issue JWT
                String token = jwtUtil.generateToken(officer.getEmail(), "ROLE_OFFICER");
                return new AuthResponse(
                        token,
                        officer.getId(),
                        officer.getEmail(),
                        officer.getName(),
                        "ROLE_OFFICER"
                );
            }

            // Not found anywhere -> unknown user
            throw new RuntimeException("No user found with this email. Please register first.");
        }

        // 🔹 Step 3: Handle Citizen / Admin login
        User user = optionalUser.get();

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid password. Please try again.");
        }

        // Officer safety check (for older accounts stored in users)
        if (user.getRole() == Role.ROLE_OFFICER) {
            boolean approved = officerRepository.findByEmail(user.getEmail()).isPresent();
            if (!approved) {
                throw new RuntimeException(
                        "Your officer account is pending admin approval. Please wait until approved."
                );
            }
        }

        // Generate JWT for Citizen/Admin
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name()
        );
    }

    /**
     * ✅ Register new user (routes officers to pending approval)
     */
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("This email is already registered. Please use a different email.");
        }

        Role role;
        switch (req.getRole().toLowerCase()) {
            case "officer":
                role = Role.ROLE_OFFICER;
                break;
            case "admin":
                role = Role.ROLE_ADMIN;
                break;
            default:
                role = Role.ROLE_CITIZEN;
                break;
        }

        // ✅ Officers go to pending approval table
        if (role == Role.ROLE_OFFICER) {
            if (pendingOfficerRepository.findByEmail(req.getEmail()).isPresent()) {
                throw new RuntimeException("Your officer registration is already pending approval.");
            }

            PendingOfficer pending = PendingOfficer.builder()
                    .name(req.getName())
                    .email(req.getEmail())
                    .password(passwordEncoder.encode(req.getPassword()))
                    .department("Unassigned")
                    .approved(false)
                    .build();

            pendingOfficerRepository.save(pending);
            throw new RuntimeException(
                    "Officer registration submitted for admin approval. You cannot log in yet."
            );
        }

        // ✅ Normal registration flow for citizens and admins
        User newUser = new User(
                req.getName(),
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                role
        );

        userRepository.save(newUser);

        String token = jwtUtil.generateToken(newUser.getEmail(), newUser.getRole().name());
        return new AuthResponse(
                token,
                newUser.getId(),
                newUser.getEmail(),
                newUser.getName(),
                newUser.getRole().name()
        );
    }
}
