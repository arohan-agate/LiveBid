'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Auction } from '@/lib/types';
import { useUser } from '@/context/UserContext';
import AuctionCard from '@/components/AuctionCard';
import { Loader2, Sparkles, Filter } from 'lucide-react';

type StatusFilter = 'ALL' | 'LIVE' | 'SCHEDULED' | 'CLOSED';

export default function HomePage() {
  const { user } = useUser();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('LIVE');

  const fetchAuctions = useCallback(async () => {
    try {
      const res = await api.get<Auction[]>('/auctions');
      setAuctions(res.data);
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
      setError('Failed to load auctions. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const filteredAuctions = auctions.filter((auction) => {
    if (filter === 'ALL') return true;
    return auction.status === filter;
  });

  const filterTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'LIVE', label: 'Live', count: auctions.filter(a => a.status === 'LIVE').length },
    { value: 'SCHEDULED', label: 'Scheduled', count: auctions.filter(a => a.status === 'SCHEDULED').length },
    { value: 'CLOSED', label: 'Closed', count: auctions.filter(a => a.status === 'CLOSED').length },
    { value: 'ALL', label: 'All', count: auctions.length },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => { setError(null); setIsLoading(true); fetchAuctions(); }}
          className="rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-16 text-center text-white shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Real-Time Auctions,<br className="hidden sm:inline" /> Real-Time Thrills.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-violet-100">
          Join thousands of bidders in live battles for exclusive items. Bid instantly, win securely.
        </p>
      </section>

      {/* Auction Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-400" />
            Auctions
          </h2>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${filter === tab.value
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-200 text-slate-600'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredAuctions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-500">
              {filter === 'LIVE'
                ? 'No live auctions right now. Check scheduled auctions!'
                : `No ${filter.toLowerCase()} auctions found.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                currentUserId={user?.id}
                onActivate={fetchAuctions}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
