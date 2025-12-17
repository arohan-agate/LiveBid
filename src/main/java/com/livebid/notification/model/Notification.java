package com.livebid.notification.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String type; // OUTBID, AUCTION_WON, SALE_COMPLETE, AUCTION_STARTED

    @Column(nullable = false)
    private String message;

    @Column(name = "auction_id")
    private UUID auctionId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Notification(UUID userId, String type, String message, UUID auctionId) {
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.auctionId = auctionId;
    }
}
