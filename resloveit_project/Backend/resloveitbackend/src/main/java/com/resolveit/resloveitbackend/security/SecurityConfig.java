package com.resolveit.resloveitbackend.security;

import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;

    public SecurityConfig(JwtUtil jwtUtil, UserRepository userRepository, OfficerRepository officerRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter(jwtUtil, userRepository, officerRepository);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ✅ CRITICAL: Permit error endpoint to prevent infinite loop
                .requestMatchers("/error").permitAll()
                
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/officers/register").permitAll()

                // FILE ACCESS - Public access to serve attachments
                .requestMatchers(HttpMethod.GET, "/api/complaints/attachments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/files/debug/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/files/complaints/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/files/officers/**").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/api/files/complaints/**").hasAnyRole("ADMIN", "OFFICER")

                // ADMIN routes
                .requestMatchers("/api/officers/pending").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // OFFICER routes
                .requestMatchers("/api/officer/complaints").hasRole("OFFICER")
                .requestMatchers("/api/officer/complaints/**").hasRole("OFFICER")
                .requestMatchers("/api/officer/**").hasRole("OFFICER")

                // *** ALLOW OFFICER + ADMIN to update complaint status / priority ***
                .requestMatchers(HttpMethod.PATCH, "/api/complaints/*/status").hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers(HttpMethod.PUT,   "/api/complaints/*/status").hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers(HttpMethod.PUT,   "/api/complaints/*/priority").hasAnyRole("ADMIN", "OFFICER")

                // ----- New SLA / Analytics / Feedback / Close / Overdue rules -----
                // SLA endpoints - Admin and Officer
                .requestMatchers("/api/sla/metrics").hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers("/api/sla/escalate").hasRole("ADMIN")
                .requestMatchers("/api/sla/config").hasRole("ADMIN")

                // Analytics endpoints - Admin and Officer
                .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "OFFICER")

                // Complaint feedback - any authenticated user
                .requestMatchers(HttpMethod.POST, "/api/complaints/*/feedback").authenticated()

                // Close complaint - Admin and Officer
                .requestMatchers(HttpMethod.POST, "/api/complaints/*/close").hasAnyRole("ADMIN", "OFFICER")

                // Overdue and escalation queries - Admin and Officer
                .requestMatchers("/api/complaints/overdue").hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers("/api/complaints/escalation-needed").hasAnyRole("ADMIN", "OFFICER")

                // Other complaint endpoints → any authenticated user
                .requestMatchers(HttpMethod.POST, "/api/complaints/submit").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/complaints/user").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/complaints").authenticated()
                .requestMatchers("/api/complaints/**").authenticated()

                .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "OFFICER")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class)
            .formLogin(form -> form.disable())
            .logout(logout -> logout.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8081",
            "http://127.0.0.1:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}