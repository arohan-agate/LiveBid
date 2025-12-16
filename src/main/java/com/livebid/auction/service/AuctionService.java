package com.livebid.auction.service;

import com.livebid.auction.dto.AuctionResponse;
import com.livebid.auction.dto.CreateAuctionRequest;
import com.livebid.auction.model.Auction;
import com.livebid.auction.model.AuctionSettlement;
import com.livebid.auction.model.AuctionStatus;
import com.livebid.auction.model.Bid;
import com.livebid.auction.repository.AuctionRepository;
import com.livebid.auction.repository.AuctionSettlementRepository;
import com.livebid.auction.repository.BidRepository;
import com.livebid.user.model.User;
import com.livebid.user.repository.UserRepository;
import com.livebid.auction.event.BidPlacedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.livebid.auction.event.AuctionClosedEvent;

import java.util.UUID;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuctionSettlementRepository auctionSettlementRepository;

    public AuctionService(AuctionRepository auctionRepository, UserRepository userRepository,
            BidRepository bidRepository, ApplicationEventPublisher eventPublisher,
            AuctionSettlementRepository auctionSettlementRepository) {
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
        this.bidRepository = bidRepository;
        this.eventPublisher = eventPublisher;
        this.auctionSettlementRepository = auctionSettlementRepository;
    }

    @Transactional
    public AuctionResponse createAuction(CreateAuctionRequest request) {
        if (request.startPrice() <= 0) {
            throw new IllegalArgumentException("Start price must be greater than 0");
        }
        if (!userRepository.existsById(request.sellerId())) {
            throw new IllegalArgumentException("Seller not found");
        }
        if (request.startTime().isAfter(request.endTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        Auction auction = new Auction();
        auction.setSellerId(request.sellerId());
        auction.setTitle(request.title());
        auction.setDescription(request.description());
        auction.setStartPrice(request.startPrice());
        auction.setStartTime(request.startTime());
        auction.setEndTime(request.endTime());
        auction.setStatus(AuctionStatus.SCHEDULED);
        auction.setCurrentPrice(request.startPrice());
        auction.setCurrentLeaderId(null);
        auction.setCurrentLeaderBidId(null);

        Auction savedAuction = auctionRepository.save(auction);
        return mapToResponse(savedAuction);
    }

    @Transactional(readOnly = true)
    public AuctionResponse getAuction(UUID id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Auction not found"));
        return mapToResponse(auction);
    }

    // Helper to map Auction to AuctionResponse
    private AuctionResponse mapToResponse(Auction auction) {
        return new AuctionResponse(
                auction.getId(),
                auction.getSellerId(),
                auction.getTitle(),
                auction.getDescription(),
                auction.getStartPrice(),
                auction.getCurrentPrice(),
                auction.getCurrentLeaderId(),
                auction.getStartTime(),
                auction.getEndTime(),
                auction.getStatus());
    }

    @Transactional
    public void convertToLive(UUID auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));
        auction.setStatus(AuctionStatus.LIVE);
        auctionRepository.save(auction);
    }

    @Transactional
    public void placeBid(UUID auctionId, UUID bidderId, long amount) {

        Auction auction = auctionRepository.findByIdWithLock(auctionId)
                .orElseThrow(() -> new IllegalStateException("Auction not found"));

        User bidder = userRepository.findByIdWithLock(bidderId)
                .orElseThrow(() -> new IllegalStateException("Bidder not found"));

        if (auction.getStatus() != AuctionStatus.LIVE) {
            throw new IllegalStateException("Auction is not live");
        }

        if (java.time.LocalDateTime.now().isAfter(auction.getEndTime())) {
            throw new IllegalStateException("Auction has ended");
        }

        if (amount <= auction.getCurrentPrice()) {
            throw new IllegalArgumentException("Bid must be higher than current price: " + auction.getCurrentPrice());
        }

        if (bidder.getAvailableBalance() < amount) {
            throw new IllegalArgumentException("Insufficient funds");
        }

        bidder.setAvailableBalance(bidder.getAvailableBalance() - amount);
        bidder.setReservedBalance(bidder.getReservedBalance() + amount);
        userRepository.save(bidder);

        if (auction.getCurrentLeaderId() != null) {
            User prevLeader = userRepository.findByIdWithLock(auction.getCurrentLeaderId())
                    .orElseThrow(() -> new IllegalStateException("Data corruption: Leader ID exists but User missing"));

            long refundAmount = auction.getCurrentPrice();
            prevLeader.setReservedBalance(prevLeader.getReservedBalance() - refundAmount);
            prevLeader.setAvailableBalance(prevLeader.getAvailableBalance() + refundAmount);
            userRepository.save(prevLeader);
        }

        Bid bid = new Bid();
        bid.setAuctionId(auctionId);
        bid.setBidderId(bidderId);
        bid.setAmount(amount);
        bid.setTimestamp(java.time.LocalDateTime.now());
        bidRepository.save(bid);

        auction.setCurrentPrice(amount);
        auction.setCurrentLeaderId(bidderId);
        auction.setCurrentLeaderBidId(bid.getId());
        auctionRepository.save(auction);

        // event for real-time updates
        eventPublisher.publishEvent(new BidPlacedEvent(auctionId, amount, bidderId));
    }

    @Transactional
    public void closeAuction(UUID auctionId) {

        int updated = auctionRepository.updateStatusToClosing(auctionId, java.time.LocalDateTime.now());
        if (updated == 0) {
            return;
        }

        Auction auction = auctionRepository.findByIdWithLock(auctionId)
                .orElseThrow(() -> new IllegalStateException("Auction not found"));

        // If there are no bids, close
        if (auction.getCurrentLeaderId() == null) {
            auction.setStatus(AuctionStatus.CLOSED);
            auctionRepository.save(auction);
            return;
        }
        User winner = userRepository.findByIdWithLock(auction.getCurrentLeaderId())
                .orElseThrow(() -> new IllegalStateException("Winner not found"));

        User seller = userRepository.findByIdWithLock(auction.getSellerId())
                .orElseThrow(() -> new IllegalStateException("Seller not found"));

        long closingPrice = auction.getCurrentPrice();
        if (winner.getReservedBalance() < closingPrice) {
            throw new IllegalStateException("Winner has insufficient funds");
        }

        winner.setReservedBalance(winner.getReservedBalance() - closingPrice);
        userRepository.save(winner);

        seller.setAvailableBalance(seller.getAvailableBalance() + closingPrice);
        userRepository.save(seller);

        AuctionSettlement auctionSettlement = new AuctionSettlement(auctionId, winner.getId(),
                seller.getId(), closingPrice);
        auctionSettlementRepository.save(auctionSettlement);

        auction.setStatus(AuctionStatus.CLOSED);
        auctionRepository.save(auction);

        eventPublisher.publishEvent(new AuctionClosedEvent(auctionId, winner.getId(), closingPrice));
    }
}
