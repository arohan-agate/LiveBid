'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, formatCurrency } from '@/lib/api';
import { connectToAuction, disconnectFromAuction } from '@/lib/socket';
import { useUser } from '@/context/UserContext';
import { Auction, BidPlacedEvent, AuctionClosedEvent } from '@/lib/types';
import { Client } from '@stomp/stompjs';
import { Loader2, Zap, Clock, Users, Send, Wifi, WifiOff, Play, Timer } from 'lucide-react';

interface BidHistoryItem {
    amount: number;
    bidderId: string;
    timestamp: Date;
}

function CountdownTimer({ endTime, onExpire }: { endTime: string; onExpire?: () => void }) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('ENDED');
                if (onExpire) onExpire();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [endTime, onExpire]);

    return (
        <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
            <Timer className={`h-5 w-5 ${!isExpired && 'animate-pulse'}`} />
            {timeLeft}
        </div>
    );
}

export default function AuctionDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user, refreshUser } = useUser();

    const [auction, setAuction] = useState<Auction | null>(null);
    const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const [bidAmount, setBidAmount] = useState('');
    const [isPlacingBid, setIsPlacingBid] = useState(false);
    const [bidError, setBidError] = useState('');

    const [isActivating, setIsActivating] = useState(false);
    const [activateError, setActivateError] = useState('');

    const stompClient = useRef<Client | null>(null);

    // Fetch auction data
    const fetchAuction = useCallback(async () => {
        try {
            const res = await api.get<Auction>(`/auctions/${id}`);
            setAuction(res.data);
            // Suggest next bid amount
            setBidAmount(String(res.data.currentPrice + 100));
        } catch (err) {
            console.error('Failed to fetch auction:', err);
            setError('Auction not found');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    // Handle incoming bid update from WebSocket
    const handleBidUpdate = useCallback((event: BidPlacedEvent) => {
        console.log('[UI] Bid update received:', event);

        // Update auction state
        setAuction((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                currentPrice: event.newPrice,
                currentLeaderId: event.newLeaderId,
            };
        });

        // Add to bid history
        const newBid: BidHistoryItem = {
            amount: event.newPrice,
            bidderId: event.newLeaderId,
            timestamp: new Date(),
        };
        setBidHistory((prev) => [newBid, ...prev.slice(0, 49)]);

        // Suggest next bid
        setBidAmount(String(event.newPrice + 100));
    }, []);

    // Handle auction closed event from WebSocket
    const handleAuctionClosed = useCallback((event: AuctionClosedEvent) => {
        console.log('[UI] Auction closed:', event);

        setAuction((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                status: 'CLOSED',
                currentPrice: event.closingPrice,
                currentLeaderId: event.winnerId,
            };
        });

        refreshUser();
    }, [refreshUser]);

    // Connect to WebSocket when component mounts
    useEffect(() => {
        fetchAuction();

        stompClient.current = connectToAuction(
            id,
            handleBidUpdate,
            handleAuctionClosed,
            () => setIsConnected(true),
            (err) => console.error('WebSocket error:', err)
        );

        return () => {
            disconnectFromAuction(stompClient.current);
        };
    }, [id, fetchAuction, handleBidUpdate, handleAuctionClosed]);

    // Handle countdown expiry - refresh auction data
    const handleCountdownExpire = useCallback(() => {
        // Wait a moment for backend to process, then refresh
        setTimeout(() => {
            fetchAuction();
        }, 2000);
    }, [fetchAuction]);

    // Activate auction
    const handleActivate = async () => {
        setActivateError('');
        setIsActivating(true);

        try {
            await api.post(`/auctions/${id}/start`);
            await fetchAuction(); // Refresh to get new endTime
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setActivateError(axiosError.response?.data?.error || 'Failed to activate');
        } finally {
            setIsActivating(false);
        }
    };

    // Place a bid
    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        setBidError('');

        if (!user) {
            router.push('/auth');
            return;
        }

        const amount = parseInt(bidAmount);
        if (isNaN(amount) || amount <= 0) {
            setBidError('Please enter a valid bid amount');
            return;
        }

        if (auction && amount <= auction.currentPrice) {
            setBidError(`Bid must be higher than ${formatCurrency(auction.currentPrice)}`);
            return;
        }

        setIsPlacingBid(true);
        try {
            await api.post(`/auctions/${id}/bids`, {
                bidderId: user.id,
                amount: amount,
            });
            await refreshUser();
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            const message = axiosError.response?.data?.error || 'Failed to place bid';
            setBidError(message);
        } finally {
            setIsPlacingBid(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <p className="text-red-500 mb-4">{error || 'Auction not found'}</p>
                <button
                    onClick={() => router.push('/')}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const isLive = auction.status === 'LIVE';
    const isClosed = auction.status === 'CLOSED';
    const isScheduled = auction.status === 'SCHEDULED';
    const isOwner = user && auction.sellerId === user.id;

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* LEFT: Product Info */}
            <div className="lg:col-span-2 space-y-6">
                {/* Image Placeholder */}
                <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-medium border border-slate-200">
                    Product Image
                </div>

                {/* Title & Description */}
                <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h1 className="text-3xl font-extrabold text-slate-900">{auction.title}</h1>
                        {isConnected ? (
                            <span className="flex items-center gap-1 text-xs text-green-600" title="Live connection active">
                                <Wifi className="h-4 w-4" />
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-red-500" title="Disconnected">
                                <WifiOff className="h-4 w-4" />
                            </span>
                        )}
                        {isOwner && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                                YOUR AUCTION
                            </span>
                        )}
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed">{auction.description}</p>
                </div>

                {/* Auction Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Status</p>
                        <p className={`text-lg font-bold ${isLive ? 'text-red-600' : isClosed ? 'text-slate-600' : 'text-amber-600'}`}>
                            {auction.status}
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {isLive ? 'Time Remaining' : 'Ends At'}
                        </p>
                        {isLive ? (
                            <CountdownTimer endTime={auction.endTime} onExpire={handleCountdownExpire} />
                        ) : (
                            <p className="text-lg font-medium text-slate-900">
                                {new Date(auction.endTime).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Activate Button for Owner */}
                {isOwner && isScheduled && (
                    <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 text-center">
                        <p className="text-sm text-emerald-700 mb-3">
                            This auction is scheduled. Activate it to start accepting bids.
                        </p>
                        {activateError && (
                            <p className="text-sm text-red-500 mb-3">{activateError}</p>
                        )}
                        <button
                            onClick={handleActivate}
                            disabled={isActivating}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-lg font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            {isActivating ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                            Activate Auction Now
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT: Bidding Panel */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden h-fit lg:sticky lg:top-24">
                {/* Price Ticker */}
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 text-center border-b border-violet-100">
                    <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-1 flex items-center justify-center gap-1">
                        <Zap className="h-4 w-4" /> Current Price
                    </p>
                    <div className="text-5xl font-black text-slate-900 tracking-tight font-mono">
                        {formatCurrency(auction.currentPrice)}
                    </div>
                    <div className="mt-4">
                        {isLive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                                </span>
                                LIVE AUCTION
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                                {auction.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Live Bid Feed */}
                <div className="flex-1 p-4 min-h-[200px] max-h-[300px] overflow-y-auto scrollbar-thin space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Users className="h-3 w-3" />
                        Live Bid Feed
                    </div>

                    {bidHistory.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-8">
                            No bids yet. Be the first!
                        </p>
                    ) : (
                        bidHistory.map((bid, index) => (
                            <div
                                key={`${bid.bidderId}-${bid.timestamp.getTime()}`}
                                className={`flex items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-slate-100 ${index === 0 ? 'ring-2 ring-violet-200' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                                        {bid.bidderId.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {bid.bidderId.substring(0, 8)}...
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {bid.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-slate-900">
                                    {formatCurrency(bid.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Bid Form */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    {user ? (
                        <form onSubmit={handlePlaceBid} className="space-y-3">
                            {bidError && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-600">
                                    {bidError}
                                </div>
                            )}

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¢</span>
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    min={auction.currentPrice + 1}
                                    className="block w-full rounded-lg border border-slate-300 pl-8 pr-4 py-3 text-lg font-mono font-medium focus:border-violet-500 focus:ring-violet-500"
                                    placeholder="Enter amount in cents"
                                    disabled={!isLive}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!isLive || isPlacingBid}
                                className="w-full rounded-lg bg-violet-600 px-4 py-3 text-lg font-bold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
                            >
                                {isPlacingBid ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                                PLACE BID
                            </button>

                            {!isLive && (
                                <p className="text-xs text-slate-500 text-center">
                                    {isClosed ? 'This auction has ended' : 'Auction is not live yet'}
                                </p>
                            )}
                        </form>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-sm text-slate-500 mb-2">Sign in to place a bid</p>
                            <button
                                onClick={() => router.push('/auth')}
                                className="w-full rounded-lg bg-slate-900 px-4 py-3 font-bold text-white hover:bg-slate-800"
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
