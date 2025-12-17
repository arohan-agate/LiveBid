package com.livebid.user.controller;

import com.livebid.auction.dto.AuctionResponse;
import com.livebid.auction.service.AuctionService;
import com.livebid.user.dto.CreateUserRequest;
import com.livebid.user.dto.UserResponse;
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

    public UserController(UserService userService, AuctionService auctionService) {
        this.userService = userService;
        this.auctionService = auctionService;
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
}
