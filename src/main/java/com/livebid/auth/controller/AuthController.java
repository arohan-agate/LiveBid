package com.livebid.auth.controller;

import com.livebid.infrastructure.security.JwtService;
import com.livebid.user.model.User;
import com.livebid.user.repository.UserRepository;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public AuthController(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest request) {
        try {
            // Verify access token with Google's userinfo endpoint
            String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = restTemplate.getForObject(
                    userInfoUrl + "?access_token=" + request.getIdToken(),
                    Map.class);

            if (userInfo == null || userInfo.containsKey("error")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token"));
            }

            String googleId = (String) userInfo.get("sub");
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");

            if (googleId == null || email == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not extract user info from Google"));
            }

            // Find or create user
            Optional<User> existingUser = userRepository.findByGoogleId(googleId);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                // Update name if changed
                if (name != null && !name.equals(user.getName())) {
                    user.setName(name);
                    userRepository.save(user);
                }
            } else {
                // Check if email already exists (user created via CLI)
                Optional<User> userByEmail = userRepository.findByEmail(email);
                if (userByEmail.isPresent()) {
                    user = userByEmail.get();
                    user.setGoogleId(googleId);
                    user.setName(name);
                    userRepository.save(user);
                } else {
                    // Create new user with $1000 starting balance
                    user = new User();
                    user.setEmail(email);
                    user.setGoogleId(googleId);
                    user.setName(name);
                    user.setAvailableBalance(100000); // $1000 in cents
                    user.setReservedBalance(0);
                    userRepository.save(user);
                }
            }

            String jwt = jwtService.generateToken(user.getId(), user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "user", Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "name", user.getName() != null ? user.getName() : "",
                            "availableBalance", user.getAvailableBalance(),
                            "reservedBalance", user.getReservedBalance())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authentication failed: " + e.getMessage()));
        }
    }

    @Data
    public static class GoogleAuthRequest {
        private String idToken;
    }
}
