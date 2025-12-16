'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Auction } from '@/lib/types';
import AuctionCard from '@/components/AuctionCard';
import { Loader2, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await api.get<Auction[]>('/auctions');
      setAuctions(res.data);
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
      setError('Failed to load auctions. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">All Auctions</h2>
          <button
            onClick={() => { setIsLoading(true); fetchAuctions(); }}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Refresh
          </button>
        </div>

        {auctions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-500">No auctions found. Why not create one?</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
