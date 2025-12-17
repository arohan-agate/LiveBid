package com.livebid.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    public JwtService(@Value("${jwt.secret:default-secret-key-for-development-only-change-in-prod}") String secret) {
        // Pad secret to 256 bits if needed
        String paddedSecret = secret.length() >= 32 ? secret : secret + "0".repeat(32 - secret.length());
        this.key = Keys.hmacShaKeyFor(paddedSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId, String email) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public UUID extractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return UUID.fromString(claims.getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
