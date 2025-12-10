package com.resolveit.resloveitbackend;

import com.resolveit.resloveitbackend.Model.Role;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableScheduling   // ✅ Scheduling enabled for SLA worker
public class ResolveitBackendApplication {  // ✅ Changed from ResloveitBackendApplication

    public static void main(String[] args) {
        SpringApplication.run(ResolveitBackendApplication.class, args);  // ✅ Update here too
    }

    /**
     * Ensures default admin exists.
     * Updates password if admin already present.
     */
    @Bean
    public CommandLineRunner createAdminUser(UserRepository userRepo, PasswordEncoder encoder) {
        return args -> {
            String adminEmail = "admin@123.io";
            String adminPassword = "admin@123";

            userRepo.findByEmail(adminEmail).ifPresentOrElse(user -> {
                user.setPassword(encoder.encode(adminPassword));
                userRepo.save(user);
                System.out.println("🔁 Admin password updated for: " + adminEmail);
            }, () -> {
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail(adminEmail);
                admin.setPassword(encoder.encode(adminPassword));
                admin.setRole(Role.ROLE_ADMIN);
                userRepo.save(admin);

                System.out.println("✅ Admin user created: " + adminEmail + " / " + adminPassword);
            });
        };
    }
}