package com.resolveit.resloveitbackend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/protected")
public class ProtectedController {

    @GetMapping("/hello")
    public String hello() {
        return "hello, authenticated user";
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/admin-only")
    public String adminOnly() {
        return "admin data";
    }

    @PreAuthorize("hasAuthority('ROLE_OFFICER')")
    @GetMapping("/officer-only")
    public String officerOnly() {
        return "officer data";
    }
}
