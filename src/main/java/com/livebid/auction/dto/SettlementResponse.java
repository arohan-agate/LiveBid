package com.livebid.auction.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SettlementResponse(
        UUID id,
        UUID auctionId,
        String auctionTitle,
        UUID counterpartyId,
        String counterpartyEmail,
        long amount,
        LocalDateTime createdAt) {
}
