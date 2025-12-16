package com.livebid.auction.event;

import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class AuctionEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    public AuctionEventListener(SimpMessagingTemplate messagingTemplate, RedisTemplate<String, Object> redisTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
    }

    @EventListener
    public void handleBidPlaced(BidPlacedEvent event) {
        // 1. Push to WebSocket clients
        // Topic: /topic/auctions/{id}
        messagingTemplate.convertAndSend("/topic/auctions/" + event.getAuctionId(), event);

        // 2. Update Redis Cache (Optimization)
        // Key: auction:{id}:price
        redisTemplate.opsForValue().set("auction:" + event.getAuctionId() + ":price", event.getNewPrice());
    }
}
