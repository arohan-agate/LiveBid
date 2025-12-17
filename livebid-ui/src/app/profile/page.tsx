'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { formatCurrency, api } from '@/lib/api';
import { Auction, Settlement } from '@/lib/types';
import AuctionCard from '@/components/AuctionCard';
import { Copy, Check, Gavel, History, Loader2, Wallet, ArrowLeft, ShoppingBag, DollarSign } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type TabId = 'auctions' | 'bids' | 'sales' | 'purchases';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading: userLoading, logout, refreshUser } = useUser();
    const [copied, setCopied] = useState(false);
    const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
    const [myBids, setMyBids] = useState<Auction[]>([]);
    const [mySales, setMySales] = useState<Settlement[]>([]);
    const [myPurchases, setMyPurchases] = useState<Settlement[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('auctions');

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            const [auctionsRes, bidsRes, salesRes, purchasesRes] = await Promise.all([
                api.get<Auction[]>(`/users/${user.id}/auctions`),
                api.get<Auction[]>(`/users/${user.id}/bids`),
                api.get<Settlement[]>(`/users/${user.id}/sales`),
                api.get<Settlement[]>(`/users/${user.id}/purchases`),
            ]);
            setMyAuctions(auctionsRes.data);
            setMyBids(bidsRes.data);
            setMySales(salesRes.data);
            setMyPurchases(purchasesRes.data);
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchUserData();
    }, [user, fetchUserData]);

    // Redirect if not logged in
    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/auth');
        }
    }, [userLoading, user, router]);

    if (userLoading || !user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const copyUserId = async () => {
        await navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs = [
        { id: 'auctions' as const, label: 'My Auctions', count: myAuctions.length, icon: <Gavel className="h-4 w-4" /> },
        { id: 'bids' as const, label: 'My Bids', count: myBids.length, icon: <History className="h-4 w-4" /> },
        { id: 'sales' as const, label: 'My Sales', count: mySales.length, icon: <DollarSign className="h-4 w-4" /> },
        { id: 'purchases' as const, label: 'My Purchases', count: myPurchases.length, icon: <ShoppingBag className="h-4 w-4" /> },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderSettlementList = (settlements: Settlement[], isSale: boolean) => {
        if (settlements.length === 0) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                    {isSale ? (
                        <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    ) : (
                        <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    )}
                    <p className="text-gray-500 mb-4">
                        {isSale ? "You haven't sold anything yet" : "You haven't purchased anything yet"}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Browse Auctions
                    </Link>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {settlements.map((settlement) => (
                    <Link
                        key={settlement.id}
                        href={`/auctions/${settlement.auctionId}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isSale ? 'bg-green-100' : 'bg-red-100'}`}>
                                {isSale ? (
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                ) : (
                                    <ShoppingBag className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{settlement.auctionTitle}</p>
                                <p className="text-sm text-gray-500">
                                    {isSale ? 'Sold to' : 'Bought from'} {settlement.counterpartyEmail} • {formatDate(settlement.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className={`text-lg font-bold ${isSale ? 'text-green-600' : 'text-red-600'}`}>
                            {isSale ? '+' : '-'}{formatCurrency(settlement.amount)}
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back Link */}
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" />
                Back to auctions
            </Link>

            {/* Profile Card */}
            <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                                {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{user.email}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="text-xs text-gray-400 font-mono">
                                        {user.id.substring(0, 8)}...
                                    </code>
                                    <button
                                        onClick={copyUserId}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Copy full ID"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="text-sm text-gray-500 hover:text-red-600"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                {/* Balance Section */}
                <div className="p-6 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Wallet className="h-4 w-4" />
                        Account Balance
                        <button onClick={refreshUser} className="ml-auto text-indigo-600 hover:text-indigo-700 text-xs font-medium">
                            Refresh
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-white border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Available</p>
                            <p className="text-2xl font-bold text-green-600 font-mono">
                                {formatCurrency(user.availableBalance)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">In Escrow</p>
                            <p className="text-2xl font-bold text-amber-600 font-mono">
                                {formatCurrency(user.reservedBalance)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {loadingData ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : activeTab === 'auctions' ? (
                myAuctions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                        <Gavel className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">You haven&apos;t created any auctions yet</p>
                        <Link
                            href="/auctions/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Create Your First Auction
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
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
            ) : activeTab === 'bids' ? (
                myBids.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                        <History className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">You haven&apos;t placed any bids yet</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Browse Auctions
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {myBids.map((auction) => (
                            <AuctionCard key={auction.id} auction={auction} currentUserId={user.id} />
                        ))}
                    </div>
                )
            ) : activeTab === 'sales' ? (
                renderSettlementList(mySales, true)
            ) : (
                renderSettlementList(myPurchases, false)
            )}
        </div>
    );
}
