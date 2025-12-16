package com.livebid.auction.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuctionClosedEvent {
    private UUID auctionId;
    private UUID winnerId;
    private long closingPrice;
}
