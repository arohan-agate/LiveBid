'use client';

import Link from 'next/link';
import { formatCurrency, api } from '@/lib/api';
import { Auction } from '@/lib/types';
import { Clock, Zap, Play, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AuctionCardProps {
    auction: Auction;
    currentUserId?: string;
    onActivate?: () => void;
}

export default function AuctionCard({ auction, currentUserId, onActivate }: AuctionCardProps) {
    const [isActivating, setIsActivating] = useState(false);
    const [activateError, setActivateError] = useState('');

    const isLive = auction.status === 'LIVE';
    const isClosed = auction.status === 'CLOSED';
    const isScheduled = auction.status === 'SCHEDULED';
    const isOwner = currentUserId && auction.sellerId === currentUserId;

    const handleActivate = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        setActivateError('');
        setIsActivating(true);

        try {
            await api.post(`/auctions/${auction.id}/start`);
            if (onActivate) {
                onActivate();
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setActivateError(axiosError.response?.data?.error || 'Failed to activate');
        } finally {
            setIsActivating(false);
        }
    };

    return (
        <Link
            href={`/auctions/${auction.id}`}
            className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
        >
            {/* Image Placeholder */}
            <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-violet-100 to-indigo-100 group-hover:from-violet-200 group-hover:to-indigo-200 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center text-violet-300 font-medium">
                    No Image
                </div>

                {/* Status Badge */}
                {isLive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                        </span>
                        LIVE
                    </div>
                )}
                {isClosed && (
                    <div className="absolute top-3 left-3 rounded-full bg-slate-500 px-2.5 py-1 text-xs font-bold text-white">
                        CLOSED
                    </div>
                )}
                {isScheduled && (
                    <div className="absolute top-3 left-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                        SCHEDULED
                    </div>
                )}

                {/* Owner Badge */}
                {isOwner && (
                    <div className="absolute top-3 right-3 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                        YOUR AUCTION
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 truncate transition-colors">
                    {auction.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {auction.description}
                </p>

                <div className="mt-4 flex items-end justify-between">
                    <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Current Price
                        </p>
                        <p className="font-mono text-xl font-bold text-slate-900">
                            {formatCurrency(auction.currentPrice)}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" /> Ends
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                            {new Date(auction.endTime).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Activate Button for Owner of Scheduled Auction */}
                {isOwner && isScheduled && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        {activateError && (
                            <p className="text-xs text-red-500 mb-2">{activateError}</p>
                        )}
                        <button
                            onClick={handleActivate}
                            disabled={isActivating}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isActivating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            Activate Auction
                        </button>
                    </div>
                )}
            </div>
        </Link>
    );
}
