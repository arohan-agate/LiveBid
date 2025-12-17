package com.livebid.auction.controller;

import com.livebid.auction.dto.AuctionResponse;
import com.livebid.auction.dto.CreateAuctionRequest;
import com.livebid.auction.service.AuctionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuctionResponse createAuction(@RequestBody @Valid CreateAuctionRequest request) {
        return auctionService.createAuction(request);
    }

    @GetMapping
    public java.util.List<AuctionResponse> getAllAuctions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        com.livebid.auction.model.AuctionStatus auctionStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                auctionStatus = com.livebid.auction.model.AuctionStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        return auctionService.searchAuctions(search, auctionStatus);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Void> startAuction(@PathVariable UUID id) {
        auctionService.convertToLive(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public AuctionResponse getAuction(@PathVariable UUID id) {
        return auctionService.getAuction(id);
    }
}
