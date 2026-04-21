package com.medicare.hms;

import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@SpringBootApplication
public class HmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(HmsApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String[][] admins = { 
                { "admin@medicare.com", "admin1234" },
                { "karim@medicare.com", "admin1234" },
                { "hasantareqoishi@gmail.com", "Admin@123" }
            };
            for (String[] admin : admins) {
                String adminEmail = admin[0];
                String adminPassword = admin[1];
                userRepository.findByEmail(adminEmail).orElseGet(() -> {
                    User user = new User();
                    user.setUsername(adminEmail);
                    user.setEmail(adminEmail);
                    user.setPassword(passwordEncoder.encode(adminPassword));
                    user.setRole(UserRole.ADMIN);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(user);
                });
            }
        };
    }
}