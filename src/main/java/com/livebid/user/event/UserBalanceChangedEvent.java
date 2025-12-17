package com.livebid.user.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserBalanceChangedEvent {
    private UUID userId;
    private long availableBalance;
    private long reservedBalance;
}
