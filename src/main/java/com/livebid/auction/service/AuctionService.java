package com.livebid.auction.service;

import com.livebid.auction.dto.AuctionResponse;
import com.livebid.auction.dto.CreateAuctionRequest;
import com.livebid.auction.model.Auction;
import com.livebid.auction.model.AuctionStatus;
import com.livebid.auction.repository.AuctionRepository;
import com.livebid.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;

    public AuctionService(AuctionRepository auctionRepository, UserRepository userRepository) {
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AuctionResponse createAuction(CreateAuctionRequest request) {
        if (request.getStartPrice() <= 0) {
            throw new IllegalArgumentException("Start price must be greater than 0");
        }
        if (!userRepository.existsById(request.getSellerId())) {
            throw new IllegalArgumentException("Seller not found");
        }
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        Auction auction = new Auction();
        auction.setSellerId(request.getSellerId());
        auction.setTitle(request.getTitle());
        auction.setDescription(request.getDescription());
        auction.setStartPrice(request.getStartPrice());
        auction.setStartTime(request.getStartTime());
        auction.setEndTime(request.getEndTime());
        auction.setStatus(AuctionStatus.SCHEDULED);
        auction.setCurrentPrice(request.getStartPrice());
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
        AuctionResponse auctionResponse = new AuctionResponse();
        auctionResponse.setId(auction.getId());
        auctionResponse.setSellerId(auction.getSellerId());
        auctionResponse.setTitle(auction.getTitle());
        auctionResponse.setDescription(auction.getDescription());
        auctionResponse.setCurrentPrice(auction.getCurrentPrice());
        auctionResponse.setCurrentLeaderId(auction.getCurrentLeaderId());
        auctionResponse.setStartTime(auction.getStartTime());
        auctionResponse.setEndTime(auction.getEndTime());
        auctionResponse.setStatus(auction.getStatus());
        return auctionResponse;
    }
}
