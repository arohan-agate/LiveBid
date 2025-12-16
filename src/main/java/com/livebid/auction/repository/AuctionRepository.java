package com.livebid.auction.repository;

import com.livebid.auction.model.Auction;
import com.livebid.auction.model.AuctionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuctionRepository extends JpaRepository<Auction, UUID> {
    List<Auction> findByStatus(AuctionStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    Optional<Auction> findByIdWithLock(@Param("id") UUID id);

    @Query("SELECT a FROM Auction a WHERE a.status = 'LIVE' AND a.endTime < :now")
    List<Auction> findExpiredLiveAuctions(@Param("now") java.time.LocalDateTime now);

    @Modifying
    @Query("UPDATE Auction a SET a.status = 'CLOSING' WHERE a.id = :id AND a.status = 'LIVE' AND a.endTime < :now")
    int updateStatusToClosing(@Param("id") UUID id, @Param("now") java.time.LocalDateTime now);
}
