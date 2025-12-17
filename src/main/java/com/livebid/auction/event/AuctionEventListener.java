package com.livebid.auction.event;

import com.livebid.auction.model.Auction;
import com.livebid.auction.repository.AuctionRepository;
import com.livebid.notification.service.NotificationService;
import com.livebid.notification.service.NotificationService.NotificationCreatedEvent;
import com.livebid.user.event.UserBalanceChangedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
public class AuctionEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final NotificationService notificationService;
    private final AuctionRepository auctionRepository;

    public AuctionEventListener(SimpMessagingTemplate messagingTemplate,
            RedisTemplate<String, Object> redisTemplate,
            NotificationService notificationService,
            AuctionRepository auctionRepository) {
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
        this.notificationService = notificationService;
        this.auctionRepository = auctionRepository;
    }

    @EventListener
    public void handleBidPlaced(BidPlacedEvent event) {
        // 1. Push to WebSocket clients
        messagingTemplate.convertAndSend("/topic/auctions/" + event.getAuctionId(), event);

        // 2. Update Redis Cache
        redisTemplate.opsForValue().set("auction:" + event.getAuctionId() + ":price", event.getNewPrice());

        // 3. Notify previous leader they've been outbid
        if (event.getPreviousLeaderId() != null && !event.getPreviousLeaderId().equals(event.getNewLeaderId())) {
            Auction auction = auctionRepository.findById(event.getAuctionId()).orElse(null);
            if (auction != null) {
                String message = "You've been outbid on \"" + auction.getTitle() + "\" - new price: $"
                        + (event.getNewPrice() / 100.0);
                notificationService.createNotification(
                        event.getPreviousLeaderId(),
                        "OUTBID",
                        message,
                        event.getAuctionId());
            }
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAuctionClosed(AuctionClosedEvent event) {
        // Broadcast to WebSocket
        messagingTemplate.convertAndSend("/topic/auctions/" + event.getAuctionId(), event);

        Auction auction = auctionRepository.findById(event.getAuctionId()).orElse(null);
        if (auction == null)
            return;

        // Notify winner
        if (event.getWinnerId() != null) {
            String winMessage = "Congratulations! You won \"" + auction.getTitle() + "\" for $"
                    + (event.getClosingPrice() / 100.0);
            notificationService.createNotification(
                    event.getWinnerId(),
                    "AUCTION_WON",
                    winMessage,
                    event.getAuctionId());
        }

        // Notify seller
        UUID sellerId = auction.getSellerId();
        if (sellerId != null) {
            String saleMessage;
            if (event.getWinnerId() != null) {
                saleMessage = "Your auction \"" + auction.getTitle() + "\" sold for $"
                        + (event.getClosingPrice() / 100.0);
            } else {
                saleMessage = "Your auction \"" + auction.getTitle() + "\" ended with no bids";
            }
            notificationService.createNotification(
                    sellerId,
                    "SALE_COMPLETE",
                    saleMessage,
                    event.getAuctionId());
        }
    }

    @EventListener
    public void handleUserBalanceChanged(UserBalanceChangedEvent event) {
        // Push balance update to user-specific topic
        messagingTemplate.convertAndSend("/topic/users/" + event.getUserId(), event);
    }

    @EventListener
    public void handleNotificationCreated(NotificationCreatedEvent event) {
        // Push notification to user-specific topic for real-time updates
        messagingTemplate.convertAndSend(
                "/topic/users/" + event.notification().getUserId() + "/notifications",
                event.notification());
    }
}
