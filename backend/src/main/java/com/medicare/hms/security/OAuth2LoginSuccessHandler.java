package com.medicare.hms.security;

import com.medicare.hms.entity.Profile;
import com.medicare.hms.entity.User;
import com.medicare.hms.entity.UserRole;
import com.medicare.hms.repository.ProfileRepository;
import com.medicare.hms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String picture = oauthUser.getAttribute("picture");
        String name = oauthUser.getAttribute("name");

        User user;
        Optional<User> userOpt = userRepository.findByEmail(email);

        boolean isInitialAdmin =  "hasantareqoishi@gmail.com".equalsIgnoreCase(email);

        if (userOpt.isPresent()) {
            user = userOpt.get();
            if (isInitialAdmin && user.getRole() != UserRole.ADMIN) {
                user.setRole(UserRole.ADMIN);
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
            }
        } else {
            // ১. নতুন ইউজার তৈরি
            user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setRole(isInitialAdmin ? UserRole.ADMIN : UserRole.PATIENT);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());

            // ফিক্স: গুগল ইউজারের জন্য একটি ডামি পাসওয়ার্ড সেট করা
            // কারণ আপনার ডাটাবেজে পাসওয়ার্ড কলামটি NOT NULL
            user.setPassword(UUID.randomUUID().toString());

            // ডাটাবেজে সেভ
            user = userRepository.save(user);

            // ২. প্রোফাইল তৈরি
            Profile profile = new Profile();
            profile.setUser(user);
            profile.setAvatarUrl(picture);
            profile.setFirstName(name); // গুগল থেকে আসা নাম সেট করা
            try {
                profileRepository.save(profile);
            } catch (Exception ex) {
                logger.warn("Profile save failed. Make sure profiles table exists and schema is up-to-date", ex);
            }
        }

        // ৩. JWT টোকেন জেনারেশন
        String token = jwtUtils.generateJwtTokenFromUsername(user.getUsername());

        // ৪. ফ্রন্টএন্ডে রিডাইরেক্ট
        String redirectUrl = String.format("%s/login-success?token=%s", frontendUrl, token);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}