package com.livebid.auction.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BidPlacedEvent {
    private UUID auctionId;
    private long newPrice;
    private UUID newLeaderId;
}
