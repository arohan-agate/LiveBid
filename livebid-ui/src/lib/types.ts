// Shared TypeScript types for LiveBid

export interface Auction {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    startPrice: number;
    currentPrice: number;
    currentLeaderId: string | null;
    startTime: string;
    endTime: string;
    status: 'SCHEDULED' | 'LIVE' | 'CLOSING' | 'CLOSED';
}

export interface User {
    id: string;
    email: string;
    availableBalance: number;
    reservedBalance: number;
}

export interface BidPlacedEvent {
    auctionId: string;
    newPrice: number;
    newLeaderId: string;
}

export interface AuctionClosedEvent {
    auctionId: string;
    winnerId: string;
    closingPrice: number;
}
