package com.livebid.auction.repository;

import com.livebid.auction.model.AuctionSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AuctionSettlementRepository extends JpaRepository<AuctionSettlement, UUID> {
    List<AuctionSettlement> findByWinnerId(UUID winnerId);

    List<AuctionSettlement> findBySellerId(UUID sellerId);
}
