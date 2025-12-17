'use client';

import Link from 'next/link';
import { formatCurrency, api } from '@/lib/api';
import { Auction } from '@/lib/types';
import { Clock, Play, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface AuctionCardProps {
    auction: Auction;
    currentUserId?: string;
    onActivate?: () => void;
}

function TimeLeft({ endTime }: { endTime: string }) {
    const [display, setDisplay] = useState('');

    const calculate = useCallback(() => {
        const end = new Date(endTime).getTime();
        const now = Date.now();
        const diff = end - now;

        if (diff <= 0) {
            setDisplay('Ended');
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            setDisplay(`${days}d ${hours % 24}h`);
        } else if (hours > 0) {
            setDisplay(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
            setDisplay(`${minutes}m ${seconds}s`);
        } else {
            setDisplay(`${seconds}s`);
        }
    }, [endTime]);

    useEffect(() => {
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [calculate]);

    return <span>{display}</span>;
}

export default function AuctionCard({ auction, currentUserId, onActivate }: AuctionCardProps) {
    const [isActivating, setIsActivating] = useState(false);

    const isLive = auction.status === 'LIVE';
    const isClosed = auction.status === 'CLOSED';
    const isScheduled = auction.status === 'SCHEDULED';
    const isOwner = currentUserId && auction.sellerId === currentUserId;

    const handleActivate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsActivating(true);

        try {
            await api.post(`/auctions/${auction.id}/start`);
            if (onActivate) onActivate();
        } catch (err) {
            console.error('Failed to activate:', err);
        } finally {
            setIsActivating(false);
        }
    };

    return (
        <Link
            href={`/auctions/${auction.id}`}
            className="group block rounded-xl bg-white border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
        >
            {/* Image */}
            <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-50">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl opacity-20">🏷️</div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    {isLive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
                            </span>
                            Live
                        </span>
                    )}
                    {isScheduled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Scheduled
                        </span>
                    )}
                    {isClosed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Ended
                        </span>
                    )}
                </div>

                {isOwner && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                            Yours
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 truncate transition-colors">
                    {auction.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                    {auction.description}
                </p>

                <div className="mt-4 flex items-end justify-between">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Current bid</p>
                        <p className="text-xl font-bold text-gray-900 font-mono">
                            {formatCurrency(auction.currentPrice)}
                        </p>
                    </div>

                    <div className="text-right">
                        {isLive && (
                            <div className="flex items-center gap-1 text-sm text-red-600 font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                <TimeLeft endTime={auction.endTime} />
                            </div>
                        )}
                        {isScheduled && (
                            <p className="text-xs text-gray-400">
                                Starts soon
                            </p>
                        )}
                        {isClosed && (
                            <p className="text-xs text-gray-400">
                                Final price
                            </p>
                        )}
                    </div>
                </div>

                {/* Activate Button */}
                {isOwner && isScheduled && (
                    <button
                        onClick={handleActivate}
                        disabled={isActivating}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {isActivating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Start Auction
                    </button>
                )}
            </div>
        </Link>
    );
}
