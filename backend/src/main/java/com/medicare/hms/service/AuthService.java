package com.medicare.hms.service;

import com.medicare.hms.dto.AuthResponse;
import com.medicare.hms.dto.LoginRequest;
import com.medicare.hms.dto.SignupRequest;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.JwtUtils;
import com.medicare.hms.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        // Validate that at least one of username or email is provided
        if (!loginRequest.isValid()) {
            throw new RuntimeException("Either username or email is required");
        }

        // Find user by email or username
        String loginIdentifier = loginRequest.getEmail() != null && !loginRequest.getEmail().isBlank()
                ? loginRequest.getEmail()
                : loginRequest.getUsername();

        User user = userRepository.findByEmail(loginIdentifier)
                .or(() -> userRepository.findByUsername(loginIdentifier))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Authenticate using the username
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtTokenFromUser(user);

        // Return role in lowercase for frontend consumption
        String role = user.getRole() != null ? user.getRole().name().toLowerCase() : "patient";

        return new AuthResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                role);
    }

    public AuthResponse refreshTokenForUser(String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwt = jwtUtils.generateJwtTokenFromUser(user);

        // Return role in lowercase for frontend consumption
        String role = user.getRole() != null ? user.getRole().name().toLowerCase() : "patient";

        return new AuthResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                role);
    }

    public void registerUser(SignupRequest signUpRequest) {
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));

        UserRole role = UserRole.PATIENT;
        if (signUpRequest.getRole() != null && !signUpRequest.getRole().isBlank()) {
            try {
                role = UserRole.valueOf(signUpRequest.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // keep default patient for invalid role values
            }
        }
        user.setRole(role);

        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
    }
}