'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { formatCurrency, api } from '@/lib/api';
import { Auction } from '@/lib/types';
import AuctionCard from '@/components/AuctionCard';
import { User, Wallet, Copy, Check, Gavel, History, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading: userLoading, logout, refreshUser } = useUser();
    const [copied, setCopied] = useState(false);
    const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
    const [myBids, setMyBids] = useState<Auction[]>([]);
    const [loadingAuctions, setLoadingAuctions] = useState(true);
    const [activeTab, setActiveTab] = useState<'created' | 'bids'>('created');

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setLoadingAuctions(true);
        try {
            const [auctionsRes, bidsRes] = await Promise.all([
                api.get<Auction[]>(`/users/${user.id}/auctions`),
                api.get<Auction[]>(`/users/${user.id}/bids`),
            ]);
            setMyAuctions(auctionsRes.data);
            setMyBids(bidsRes.data);
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        } finally {
            setLoadingAuctions(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user, fetchUserData]);

    // Redirect if not logged in
    if (!userLoading && !user) {
        router.push('/auth');
        return null;
    }

    if (userLoading || !user) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    const copyUserId = async () => {
        await navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto max-w-4xl py-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                    Sign Out
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                            User ID
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 font-mono text-sm bg-slate-50 p-2 rounded border border-slate-100 truncate">
                                {user.id}
                            </code>
                            <button
                                onClick={copyUserId}
                                className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                                title="Copy ID"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                            Email
                        </p>
                        <p className="font-medium text-slate-900 flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            {user.email}
                        </p>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-slate-600" />
                            Financials
                        </h2>
                        <button
                            onClick={refreshUser}
                            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                            <p className="text-sm text-emerald-600 font-medium">Available Balance</p>
                            <p className="text-2xl font-bold text-emerald-700 font-mono">
                                {formatCurrency(user.availableBalance)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                            <p className="text-sm text-amber-600 font-medium">Reserved (In Escrow)</p>
                            <p className="text-2xl font-bold text-amber-700 font-mono">
                                {formatCurrency(user.reservedBalance)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs for My Auctions / My Bids */}
            <div className="space-y-4">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'created'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Gavel className="h-4 w-4" />
                        My Auctions
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700">
                            {myAuctions.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('bids')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'bids'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <History className="h-4 w-4" />
                        My Bids
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700">
                            {myBids.length}
                        </span>
                    </button>
                </div>

                {loadingAuctions ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : activeTab === 'created' ? (
                    myAuctions.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white py-12 text-center">
                            <Gavel className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500">You haven&apos;t created any auctions yet.</p>
                            <button
                                onClick={() => router.push('/auctions/create')}
                                className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-700"
                            >
                                Create Your First Auction
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {myAuctions.map((auction) => (
                                <AuctionCard
                                    key={auction.id}
                                    auction={auction}
                                    currentUserId={user.id}
                                    onActivate={fetchUserData}
                                />
                            ))}
                        </div>
                    )
                ) : myBids.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white py-12 text-center">
                        <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500">You haven&apos;t placed any bids yet.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-700"
                        >
                            Browse Auctions
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {myBids.map((auction) => (
                            <AuctionCard
                                key={auction.id}
                                auction={auction}
                                currentUserId={user.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            <p className="text-sm text-slate-500 text-center">
                💡 Tip: Use the CLI tool (<code className="bg-slate-100 px-1 rounded">python cli.py</code>) to add funds to your account.
            </p>
        </div>
    );
}
