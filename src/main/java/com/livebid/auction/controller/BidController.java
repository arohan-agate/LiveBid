package com.livebid.auction.controller;

import com.livebid.auction.dto.PlaceBidRequest;
import com.livebid.auction.service.AuctionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auctions")
public class BidController {

    private final AuctionService auctionService;

    public BidController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @PostMapping("/{auctionId}/bids")
    public ResponseEntity<Void> placeBid(
            @PathVariable UUID auctionId,
            @RequestBody @Valid PlaceBidRequest request) {

        auctionService.placeBid(auctionId, request.getBidderId(), request.getAmount());
        return ResponseEntity.accepted().build();
    }
}
