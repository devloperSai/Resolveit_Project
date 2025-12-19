package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.dto.*;
import com.resolveit.resloveitbackend.Model.User; 
import com.resolveit.resloveitbackend.repository.UserRepository;
import com.resolveit.resloveitbackend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    // ✅ REGISTER endpoint with detailed feedback
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        try {
            AuthResponse response = authService.register(req);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            // Return a descriptive message from AuthService
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ex.getMessage());
        } catch (Exception ex) {
            // Fallback for unexpected errors
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred during registration.");
        }
    }

    // ✅ LOGIN endpoint with specific error handling
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest req) {
        try {
            AuthResponse response = authService.login(req.getEmail(), req.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            // Return specific message for invalid email/password
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ex.getMessage());
        } catch (Exception ex) {
            // Fallback for unexpected errors
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred during login.");
        }
    }

    // ✅ ME endpoint (fetch user info using token)
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not authenticated");
        }

        // JwtAuthFilter sets the authenticated User as the principal
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return ResponseEntity.ok(
                    new AuthResponse(null, user.getId(), user.getEmail(), user.getName(), user.getRole().name())
            );
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid authentication token.");
        }
    }
}
