package com.livebid.auction.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class PlaceBidRequest {
    @NotNull
    private UUID bidderId;

    @Min(1)
    private long amount;
}
