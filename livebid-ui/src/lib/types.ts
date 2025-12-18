// Update TypeScript types for extended events

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
    imageKey: string | null;
    imageUrl: string | null;
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

export interface UserBalanceChangedEvent {
    userId: string;
    availableBalance: number;
    reservedBalance: number;
}

export interface Settlement {
    id: string;
    auctionId: string;
    auctionTitle: string;
    counterpartyId: string;
    counterpartyEmail: string;
    amount: number;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'OUTBID' | 'AUCTION_WON' | 'SALE_COMPLETE' | 'AUCTION_STARTED';
    message: string;
    auctionId: string | null;
    read: boolean;
    createdAt: string;
}
