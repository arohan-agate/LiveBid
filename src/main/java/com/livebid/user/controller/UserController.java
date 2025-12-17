package com.livebid.user.controller;

import com.livebid.auction.dto.AuctionResponse;
import com.livebid.auction.dto.SettlementResponse;
import com.livebid.auction.model.Auction;
import com.livebid.auction.model.AuctionSettlement;
import com.livebid.auction.repository.AuctionRepository;
import com.livebid.auction.repository.AuctionSettlementRepository;
import com.livebid.auction.service.AuctionService;
import com.livebid.user.dto.CreateUserRequest;
import com.livebid.user.dto.UserResponse;
import com.livebid.user.model.User;
import com.livebid.user.repository.UserRepository;
import com.livebid.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final AuctionService auctionService;
    private final AuctionSettlementRepository settlementRepository;
    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;

    public UserController(UserService userService, AuctionService auctionService,
            AuctionSettlementRepository settlementRepository,
            AuctionRepository auctionRepository,
            UserRepository userRepository) {
        this.userService = userService;
        this.auctionService = auctionService;
        this.settlementRepository = settlementRepository;
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@RequestBody @Valid CreateUserRequest request) {
        return userService.createUser(request);
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return userService.getUser(id);
    }

    @GetMapping("/{id}/auctions")
    public List<AuctionResponse> getUserAuctions(@PathVariable UUID id) {
        return auctionService.getAuctionsBySeller(id);
    }

    @GetMapping("/{id}/bids")
    public List<AuctionResponse> getUserBids(@PathVariable UUID id) {
        return auctionService.getAuctionsByBidder(id);
    }

    @GetMapping("/{id}/sales")
    public List<SettlementResponse> getUserSales(@PathVariable UUID id) {
        return settlementRepository.findBySellerId(id).stream()
                .map(s -> mapToSettlementResponse(s, s.getWinnerId()))
                .toList();
    }

    @GetMapping("/{id}/purchases")
    public List<SettlementResponse> getUserPurchases(@PathVariable UUID id) {
        return settlementRepository.findByWinnerId(id).stream()
                .map(s -> mapToSettlementResponse(s, s.getSellerId()))
                .toList();
    }

    private SettlementResponse mapToSettlementResponse(AuctionSettlement settlement, UUID counterpartyId) {
        Auction auction = auctionRepository.findById(settlement.getAuctionId()).orElse(null);
        User counterparty = userRepository.findById(counterpartyId).orElse(null);

        return new SettlementResponse(
                settlement.getId(),
                settlement.getAuctionId(),
                auction != null ? auction.getTitle() : "Unknown Auction",
                counterpartyId,
                counterparty != null ? counterparty.getEmail() : "Unknown",
                settlement.getAmount(),
                settlement.getCreatedAt());
    }
}
