package com.livebid.infrastructure.scheduler;

import com.livebid.auction.model.Auction;
import com.livebid.auction.repository.AuctionRepository;
import com.livebid.auction.service.AuctionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuctionClosingScheduler {

    private final AuctionRepository auctionRepository;
    private final AuctionService auctionService;

    public AuctionClosingScheduler(AuctionRepository auctionRepository, AuctionService auctionService) {
        this.auctionRepository = auctionRepository;
        this.auctionService = auctionService;
    }

    @Scheduled(fixedRate = 10000) // Run every 10 seconds
    public void closeExpiredAuctions() {
        List<Auction> expiredAuctions = auctionRepository.findExpiredLiveAuctions(java.time.LocalDateTime.now());

        for (Auction auction : expiredAuctions) {
            try {
                // Delegate the transactional heavy lifting to the service
                auctionService.closeAuction(auction.getId());
            } catch (Exception e) {
                System.err.println("Failed to close auction " + auction.getId() + ": " + e.getMessage());
            }
        }
    }
}
