package com.livebid.auction.dto;

import com.livebid.auction.model.AuctionStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record AuctionResponse(
        UUID id,
        UUID sellerId,
        String title,
        String description,
        long startPrice,
        long currentPrice,
        UUID currentLeaderId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        AuctionStatus status) {
}
