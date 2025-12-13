package com.livebid.auction.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class CreateAuctionRequest {
    @NotNull
    private UUID sellerId;

    @NotBlank
    private String title;

    private String description;

    @Min(1)
    private long startPrice;

    @Future
    @NotNull
    private LocalDateTime startTime;

    @Future
    @NotNull
    private LocalDateTime endTime;
}
