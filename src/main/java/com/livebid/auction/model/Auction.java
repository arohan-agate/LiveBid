package com.livebid.auction.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "auctions")
@Getter
@Setter
@NoArgsConstructor
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sellerId; // Keeping as ID for loose coupling, or @ManyToOne User

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private long startPrice;

    @Column(nullable = false)
    private long currentPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuctionStatus status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(name = "current_leader_id")
    private UUID currentLeaderId;

    @Column(name = "current_leader_bid_id")
    private UUID currentLeaderBidId;

    @Column(name = "image_key")
    private String imageKey;

    @Version // Optimistic Locking
    private Long version;
}
