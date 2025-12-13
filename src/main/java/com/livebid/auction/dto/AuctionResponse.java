package com.livebid.auction.dto;

import com.livebid.auction.model.AuctionStatus;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class AuctionResponse {
    private UUID id;
    private UUID sellerId;
    private String title;
    private String description;
    private long currentPrice;
    private AuctionStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
