'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, formatCurrency } from '@/lib/api';
import { connectToAuction, disconnectFromAuction } from '@/lib/socket';
import { useUser } from '@/context/UserContext';
import { Auction, BidPlacedEvent, AuctionClosedEvent } from '@/lib/types';
import { Client } from '@stomp/stompjs';
import { Loader2, Clock, Users, ArrowLeft, Play, Timer, Wifi, WifiOff, Trophy } from 'lucide-react';
import Link from 'next/link';

interface BidHistoryItem {
    amount: number;
    bidderId: string;
    timestamp: Date;
}

function getMinBid(currentPrice: number): number {
    const minIncrement = Math.max(Math.floor(currentPrice * 0.05), 100);
    return currentPrice + minIncrement;
}

function CountdownTimer({ endTime, onExpire }: { endTime: string; onExpire?: () => void }) {
    const [display, setDisplay] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setDisplay('Ended');
                if (onExpire) onExpire();
                return;
            }

            setIsUrgent(diff < 60000); // Less than 1 minute

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setDisplay(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setDisplay(`${minutes}m ${seconds}s`);
            } else {
                setDisplay(`${seconds}s`);
            }
        };

        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [endTime, onExpire]);

    return (
        <div className={`flex items-center gap-2 text-2xl font-bold font-mono ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
            <Timer className={`h-5 w-5 ${isUrgent && 'animate-pulse'}`} />
            {display}
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

    const stompClient = useRef<Client | null>(null);

    const fetchAuction = useCallback(async () => {
        try {
            const res = await api.get<Auction>(`/auctions/${id}`);
            setAuction(res.data);
            setBidAmount(String(getMinBid(res.data.currentPrice)));
        } catch {
            setError('Auction not found');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const handleBidUpdate = useCallback((event: BidPlacedEvent) => {
        setAuction((prev) => prev ? { ...prev, currentPrice: event.newPrice, currentLeaderId: event.newLeaderId } : null);
        setBidHistory((prev) => [{ amount: event.newPrice, bidderId: event.newLeaderId, timestamp: new Date() }, ...prev.slice(0, 19)]);
        setBidAmount(String(getMinBid(event.newPrice)));
    }, []);

    const handleAuctionClosed = useCallback((event: AuctionClosedEvent) => {
        setAuction((prev) => prev ? { ...prev, status: 'CLOSED', currentPrice: event.closingPrice, currentLeaderId: event.winnerId } : null);
        refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        fetchAuction();
        stompClient.current = connectToAuction(id, handleBidUpdate, handleAuctionClosed, () => setIsConnected(true), () => { });
        return () => { disconnectFromAuction(stompClient.current); };
    }, [id, fetchAuction, handleBidUpdate, handleAuctionClosed]);

    const handleActivate = async () => {
        setIsActivating(true);
        try {
            await api.post(`/auctions/${id}/start`);
            await fetchAuction();
        } catch { /* ignore */ }
        finally { setIsActivating(false); }
    };

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        setBidError('');
        if (!user) { router.push('/auth'); return; }

        const amount = parseInt(bidAmount);
        if (isNaN(amount) || amount <= 0 || (auction && amount <= auction.currentPrice)) {
            setBidError('Bid must be higher than current price');
            return;
        }

        setIsPlacingBid(true);
        try {
            await api.post(`/auctions/${id}/bids`, { bidderId: user.id, amount });
            await refreshUser();
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setBidError(axiosError.response?.data?.error || 'Bid failed');
        } finally { setIsPlacingBid(false); }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center">
                <p className="text-gray-500 mb-4">{error}</p>
                <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Back to auctions</Link>
            </div>
        );
    }

    const isLive = auction.status === 'LIVE';
    const isClosed = auction.status === 'CLOSED';
    const isScheduled = auction.status === 'SCHEDULED';
    const isOwner = user && auction.sellerId === user.id;
    const isWinner = isClosed && user && auction.currentLeaderId === user.id;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Link */}
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="h-4 w-4" />
                All auctions
            </Link>

            <div className="grid gap-8 lg:grid-cols-5">
                {/* LEFT: Details */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Image */}
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200">
                        <span className="text-6xl opacity-20">🏷️</span>
                    </div>

                    {/* Info */}
                    <div>
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            {isLive && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                    </span>
                                    Live
                                </span>
                            )}
                            {isScheduled && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Scheduled</span>}
                            {isClosed && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Ended</span>}
                            {isOwner && <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Your auction</span>}
                            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                                {isConnected ? <><Wifi className="h-3.5 w-3.5 text-green-500" /> Live</> : <><WifiOff className="h-3.5 w-3.5" /> Offline</>}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{auction.title}</h1>
                        <p className="mt-2 text-gray-600">{auction.description}</p>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-white border border-gray-200 p-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {isLive ? 'Time Left' : 'End Time'}
                            </p>
                            {isLive ? (
                                <CountdownTimer endTime={auction.endTime} onExpire={() => setTimeout(fetchAuction, 2000)} />
                            ) : (
                                <p className="text-lg font-medium text-gray-900">{new Date(auction.endTime).toLocaleString()}</p>
                            )}
                        </div>
                        <div className="rounded-lg bg-white border border-gray-200 p-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Start Price</p>
                            <p className="text-lg font-medium text-gray-900 font-mono">{formatCurrency(auction.startPrice)}</p>
                        </div>
                    </div>

                    {/* Activate CTA */}
                    {isOwner && isScheduled && (
                        <button
                            onClick={handleActivate}
                            disabled={isActivating}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                            Start Auction Now
                        </button>
                    )}

                    {/* Winner Banner */}
                    {isWinner && (
                        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                            <Trophy className="h-6 w-6 text-amber-500" />
                            <div>
                                <p className="font-semibold text-amber-800">Congratulations!</p>
                                <p className="text-sm text-amber-700">You won this auction for {formatCurrency(auction.currentPrice)}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Bidding */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden sticky top-24">
                        {/* Price */}
                        <div className="p-6 text-center border-b border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Bid</p>
                            <p className="text-4xl font-bold text-gray-900 font-mono">{formatCurrency(auction.currentPrice)}</p>
                        </div>

                        {/* Bid Feed */}
                        <div className="p-4 max-h-64 overflow-y-auto border-b border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                <Users className="h-3.5 w-3.5" />
                                Recent Bids
                            </div>
                            {bidHistory.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-6">No bids yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {bidHistory.map((bid, i) => (
                                        <div key={`${bid.bidderId}-${bid.timestamp.getTime()}`} className={`flex justify-between items-center p-2 rounded-lg ${i === 0 ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                    {bid.bidderId.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-xs text-gray-500">{bid.timestamp.toLocaleTimeString()}</span>
                                            </div>
                                            <span className="font-mono font-semibold text-gray-900">{formatCurrency(bid.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bid Form */}
                        <div className="p-4">
                            {user ? (
                                <form onSubmit={handlePlaceBid} className="space-y-3">
                                    {bidError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{bidError}</p>}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Your bid (in cents)</label>
                                        <input
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-lg focus:border-indigo-500 focus:ring-indigo-500"
                                            disabled={!isLive}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!isLive || isPlacingBid}
                                        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isPlacingBid && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Place Bid
                                    </button>
                                    {!isLive && <p className="text-xs text-gray-400 text-center">{isClosed ? 'Auction ended' : 'Not live yet'}</p>}
                                </form>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-3">Sign in to bid</p>
                                    <Link href="/auth" className="block rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800">
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
