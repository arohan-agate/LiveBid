package com.livebid.auction.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "auction_settlements")
@Data
@NoArgsConstructor
public class AuctionSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "auction_id", nullable = false, unique = true)
    private UUID auctionId;

    @Column(name = "winner_id", nullable = false)
    private UUID winnerId;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(nullable = false)
    private long amount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuctionSettlement(UUID auctionId, UUID winnerId, UUID sellerId, long amount) {
        this.auctionId = auctionId;
        this.winnerId = winnerId;
        this.sellerId = sellerId;
        this.amount = amount;
    }
}
