package com.resolveit.resloveitbackend.security;

import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JwtAuthFilter
 *
 * Improvements:
 * - Robust parsing of role claim (single value, comma-separated, or bracketed list)
 * - Normalize role strings to ROLE_ prefix (Spring expects that for hasRole checks)
 * - Attach a list of GrantedAuthority to the Authentication
 * - Use INFO-level logging for the key events so we can see it in the console
 *
 * No other behavior changed.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository, OfficerRepository officerRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
    }

    private String normalizeRoleSingle(String raw) {
        if (raw == null) return null;
        String r = raw.trim().toUpperCase();
        if (!r.startsWith("ROLE_")) r = "ROLE_" + r;
        return r;
    }

    /**
     * Parse role claim into a list of normalized role strings.
     * Accepts:
     *  - "ROLE_OFFICER"
     *  - "OFFICER"
     *  - "OFFICER,ADMIN"
     *  - "[\"ROLE_OFFICER\",\"ROLE_ADMIN\"]" or "[ROLE_OFFICER,ROLE_ADMIN]" (will be sanitized)
     */
    private List<String> parseRoles(String roleClaim) {
        if (roleClaim == null || roleClaim.isBlank()) return Collections.emptyList();

        // Remove surrounding brackets and quotes if present
        String cleaned = roleClaim.trim();
        if (cleaned.startsWith("[")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.endsWith("]")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        // Remove double quotes
        cleaned = cleaned.replace("\"", "");

        // Split by comma or whitespace
        String[] parts = cleaned.split("\\s*,\\s*|\\s+");
        return Arrays.stream(parts)
                .filter(s -> s != null && !s.isBlank())
                .map(this::normalizeRoleSingle)
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = null;
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }

        try {
            if (token != null && jwtUtil.validate(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                Claims claims = jwtUtil.getClaims(token);
                String email = claims.getSubject();
                String roleFromToken = claims.get("role", String.class);

                var details = new WebAuthenticationDetailsSource().buildDetails(request);

                // Build authorities list either from token or DB-derived role
                List<String> normalizedRoles = new ArrayList<>();

                // 1. If token provided roles, prefer that
                if (roleFromToken != null && !roleFromToken.isBlank()) {
                    normalizedRoles.addAll(parseRoles(roleFromToken));
                }

                // 2. Try to resolve user (CITIZEN / ADMIN)
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (normalizedRoles.isEmpty()) {
                        normalizedRoles.add(normalizeRoleSingle(user.getRole().name()));
                    }
                    List<GrantedAuthority> authorities = normalizedRoles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    var auth = new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);
                    auth.setDetails(details);
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    // INFO so it shows in console logs
                    logger.info("JwtAuthFilter: authenticated USER '{}' authorities={}", user.getEmail(), normalizedRoles);
                }
                // 3. Try to resolve officer
                else {
                    Optional<Officer> officerOpt = officerRepository.findByEmail(email);
                    if (officerOpt.isPresent()) {
                        Officer officer = officerOpt.get();
                        if (normalizedRoles.isEmpty()) {
                            // officer.getRole() might be "OFFICER" or "ROLE_OFFICER"
                            String r = officer.getRole();
                            if (r == null || r.isBlank()) {
                                r = "OFFICER";
                            }
                            normalizedRoles.add(normalizeRoleSingle(r));
                        }

                        List<GrantedAuthority> authorities = normalizedRoles.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                        var auth = new UsernamePasswordAuthenticationToken(officer.getEmail(), null, authorities);
                        auth.setDetails(details);
                        SecurityContextHolder.getContext().setAuthentication(auth);

                        logger.info("JwtAuthFilter: authenticated OFFICER '{}' authorities={}", officer.getEmail(), normalizedRoles);
                    } else {
                        logger.info("JwtAuthFilter: token valid but no user/officer found for email '{}' (request {} {})", email, request.getMethod(), request.getRequestURI());
                    }
                }
            } else {
                if (token == null) {
                    logger.info("JwtAuthFilter: no JWT token present for request {} {}", request.getMethod(), request.getRequestURI());
                } else if (!jwtUtil.validate(token)) {
                    logger.info("JwtAuthFilter: JWT validation failed for request {} {}", request.getMethod(), request.getRequestURI());
                } else {
                    logger.info("JwtAuthFilter: security context already has authentication for request {} {}", request.getMethod(), request.getRequestURI());
                }
            }
        } catch (Exception ex) {
            logger.warn("JwtAuthFilter: failed to process token for request {} {} -> {}", request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        }

        filterChain.doFilter(request, response);
    }
}
