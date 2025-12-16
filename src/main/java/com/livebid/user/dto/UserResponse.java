package com.livebid.user.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        long availableBalance,
        long reservedBalance) {
}
