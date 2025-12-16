package com.livebid.auction.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateAuctionRequest(
        @NotNull UUID sellerId,
        @NotBlank String title,
        String description,
        @Min(1) long startPrice,
        @NotNull LocalDateTime startTime,
        @NotNull @Future LocalDateTime endTime) {
}
