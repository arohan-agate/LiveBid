package com.livebid.user.service;

import com.livebid.user.dto.CreateUserRequest;
import com.livebid.user.dto.UserResponse;
import com.livebid.user.model.User;
import com.livebid.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setAvailableBalance(100000);
        user.setReservedBalance(0);

        User savedUser = userRepository.save(user);
        UserResponse userResponse = mapToResponse(savedUser);
        return userResponse;
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToResponse(user);
    }

    // Helper to map User to UserResponse
    private UserResponse mapToResponse(User user) {
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setEmail(user.getEmail());
        userResponse.setAvailableBalance(user.getAvailableBalance());
        userResponse.setReservedBalance(user.getReservedBalance());
        return userResponse;
    }
}
