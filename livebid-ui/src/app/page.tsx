'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Auction } from '@/lib/types';
import { useUser } from '@/context/UserContext';
import AuctionCard from '@/components/AuctionCard';
import { Loader2, Radio, Calendar, CheckCircle, LayoutGrid } from 'lucide-react';

type StatusFilter = 'ALL' | 'LIVE' | 'SCHEDULED' | 'CLOSED';

const filterConfig: { value: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'LIVE', label: 'Live Now', icon: <Radio className="h-4 w-4" />, color: 'text-red-600' },
  { value: 'SCHEDULED', label: 'Upcoming', icon: <Calendar className="h-4 w-4" />, color: 'text-amber-600' },
  { value: 'CLOSED', label: 'Ended', icon: <CheckCircle className="h-4 w-4" />, color: 'text-gray-500' },
  { value: 'ALL', label: 'All', icon: <LayoutGrid className="h-4 w-4" />, color: 'text-gray-600' },
];

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

  const getCounts = () => ({
    LIVE: auctions.filter(a => a.status === 'LIVE').length,
    SCHEDULED: auctions.filter(a => a.status === 'SCHEDULED').length,
    CLOSED: auctions.filter(a => a.status === 'CLOSED').length,
    ALL: auctions.length,
  });

  const counts = getCounts();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading auctions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <Radio className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Connection Error</h2>
        <p className="text-gray-500 mb-4 max-w-sm">{error}</p>
        <button
          onClick={() => { setError(null); setIsLoading(true); fetchAuctions(); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Auctions</h1>
          <p className="text-gray-500 mt-1">Find and bid on unique items in real-time</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filterConfig.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === item.value
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
          >
            <span className={filter === item.value ? 'text-white' : item.color}>
              {item.icon}
            </span>
            {item.label}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${filter === item.value
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
              }`}>
              {counts[item.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Auction Grid */}
      {filteredAuctions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {filterConfig.find(f => f.value === filter)?.icon}
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No {filter.toLowerCase()} auctions</h3>
          <p className="text-gray-500 text-sm">
            {filter === 'LIVE'
              ? 'Check back soon or browse upcoming auctions'
              : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
