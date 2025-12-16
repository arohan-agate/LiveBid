package com.livebid.service;

import com.livebid.auction.model.Auction;
import com.livebid.auction.model.AuctionStatus;
import com.livebid.auction.repository.AuctionRepository;
import com.livebid.auction.repository.AuctionSettlementRepository;
import com.livebid.auction.repository.BidRepository;
import com.livebid.auction.service.AuctionService;
import com.livebid.user.model.User;
import com.livebid.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuctionServiceUnitTest {

    @Mock
    private AuctionRepository auctionRepository;
    @Mock
    private BidRepository bidRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuctionSettlementRepository settlementRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AuctionService auctionService;

    private User seller;
    private User bidder;
    private Auction auction;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(UUID.randomUUID());
        seller.setEmail("seller@test.com");
        seller.setAvailableBalance(0);

        bidder = new User();
        bidder.setId(UUID.randomUUID());
        bidder.setEmail("bidder@test.com");
        bidder.setAvailableBalance(1000);
        bidder.setReservedBalance(0);

        auction = new Auction();
        auction.setId(UUID.randomUUID());
        auction.setSellerId(seller.getId());
        auction.setStartPrice(100);
        auction.setCurrentPrice(100);
        auction.setStatus(AuctionStatus.LIVE);
        auction.setEndTime(LocalDateTime.now().plusHours(1)); // Future
    }

    @Test
    void testPlaceBid_Success() {
        when(auctionRepository.findByIdWithLock(auction.getId())).thenReturn(Optional.of(auction));
        when(userRepository.findByIdWithLock(bidder.getId())).thenReturn(Optional.of(bidder));

        auctionService.placeBid(auction.getId(), bidder.getId(), 200);

        assertEquals(200, auction.getCurrentPrice());
        assertEquals(bidder.getId(), auction.getCurrentLeaderId());
        // Verify balances logic mimics
        // Since we are mocking, the service method 'placeBid' modifies the objects.
        // Logic:
        // 1. Check balance -> 1000 >= 200. OK.
        // 2. Reserve -> bidder available -= 200 (800), reserved += 200 (200).

        assertEquals(800, bidder.getAvailableBalance());
        assertEquals(200, bidder.getReservedBalance());

        verify(auctionRepository).save(auction);
        verify(userRepository).save(bidder);
    }

    @Test
    void testPlaceBid_InsufficientFunds() {
        when(auctionRepository.findByIdWithLock(auction.getId())).thenReturn(Optional.of(auction));
        when(userRepository.findByIdWithLock(bidder.getId())).thenReturn(Optional.of(bidder));

        // Bid > 1000
        assertThrows(IllegalArgumentException.class,
                () -> auctionService.placeBid(auction.getId(), bidder.getId(), 1500));
    }

    @Test
    void testCloseAuction_Settlement() {
        // Setup: Auction has a winner
        auction.setCurrentLeaderId(bidder.getId());
        auction.setCurrentPrice(500);
        bidder.setReservedBalance(500); // Pre-reserved from the bid
        bidder.setAvailableBalance(500);

        // We mock updateStatusToClosing to return 1 (success)
        when(auctionRepository.updateStatusToClosing(eq(auction.getId()), any(LocalDateTime.class)))
                .thenReturn(1);

        when(auctionRepository.findByIdWithLock(auction.getId())).thenReturn(Optional.of(auction));
        when(userRepository.findByIdWithLock(bidder.getId())).thenReturn(Optional.of(bidder));
        when(userRepository.findByIdWithLock(seller.getId())).thenReturn(Optional.of(seller));

        auctionService.closeAuction(auction.getId());

        assertEquals(AuctionStatus.CLOSED, auction.getStatus());

        // Winner: Reserved 500 -> 0. (Funds taken)
        assertEquals(0, bidder.getReservedBalance());
        // Seller: Available 0 -> +500.
        assertEquals(500, seller.getAvailableBalance());

        verify(settlementRepository).save(any());
        verify(auctionRepository, times(1)).save(auction); // Updated to CLOSED
    }
}
