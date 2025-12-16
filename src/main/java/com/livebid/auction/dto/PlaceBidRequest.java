package com.livebid.auction.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PlaceBidRequest(
        @NotNull UUID bidderId,
        @Min(1) long amount) {
}
