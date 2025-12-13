package com.livebid.user.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class UserResponse {
    private UUID id;
    private String email;
    private long availableBalance;
    private long reservedBalance;
}
