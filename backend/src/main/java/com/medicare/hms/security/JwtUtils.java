package com.medicare.hms.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    // Token expiration is in milliseconds (default 24 hours)
    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    // Builds the HMAC signing key used to verify JWTs.
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Generates a signed JWT for an authenticated principal.
    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        return generateJwtToken(userPrincipal.getUsername(),
                userPrincipal.getAuthorities().stream().findFirst().map(Object::toString).orElse(""));
    }

    // Generates a signed JWT using only a username.
    public String generateJwtTokenFromUsername(String username) {
        return generateJwtToken(username, "");
    }

    // Generates a signed JWT including the user's role claim.
    public String generateJwtTokenFromUser(com.medicare.hms.entity.User user) {
        String roleClaim = "ROLE_" + (user.getRole() != null ? user.getRole().name() : "PATIENT");
        return generateJwtToken(user.getUsername(), roleClaim);
    }

    // Generates a signed JWT for an authenticated principal.
    private String generateJwtToken(String username, String roleClaim) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", roleClaim)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Reads the username subject from a JWT.
    public String getUserNameFromJwtToken(String token) {
        return extractUsername(token);
    }

    // Extracts the username subject claim from a JWT.
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extracts a specific claim from a JWT using the supplied resolver.
    public <T> T extractClaim(String token, java.util.function.Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody();
        return claimsResolver.apply(claims);
    }

    // Checks whether a JWT expiry time has passed.
    public boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        Instant now = Instant.now();
        boolean expired = expiration.toInstant().isBefore(now);
        if (expired) {
            logger.debug("[JWT] token expired (expiration={}, now={})", expiration, Date.from(now));
        }
        return expired;
    }

    // Checks that a JWT belongs to the supplied user and is not expired.
    public boolean isTokenValid(String token, org.springframework.security.core.userdetails.UserDetails userDetails) {
        // Extracts the username subject claim from a JWT.
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Validates a JWT signature and structure before it is trusted.
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.warn("[JWT] Invalid token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            Date expiration = e.getClaims() != null ? e.getClaims().getExpiration() : null;
            String roleClaim = null;
            if (e.getClaims() != null && e.getClaims().containsKey("role")) {
                roleClaim = String.valueOf(e.getClaims().get("role"));
            }
            logger.warn("[JWT] Expired token (expiration={}, now={}, role={}): {}", expiration,
                    Date.from(Instant.now()), roleClaim,
                    e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.warn("[JWT] Unsupported token: {} (role={})", e.getMessage(), extractRoleClaim(authToken));
        } catch (IllegalArgumentException e) {
            logger.warn("[JWT] Empty or null token: {}", e.getMessage());
        }

        return false;
    }

    // Reads the role claim from a JWT if one is present.
    private String extractRoleClaim(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2)
                return null;
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode node = new ObjectMapper().readTree(decoded);
            JsonNode roleNode = node.get("role");
            return roleNode != null ? roleNode.asText() : null;
        } catch (Exception e) {
            logger.debug("[JWT] Unable to parse role from token: {}", e.getMessage());
            return null;
        }
    }

}
