'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { Auction } from '@/lib/types';
import { Loader2, Gavel } from 'lucide-react';

export default function CreateAuctionPage() {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startPrice: 1000,
        durationMinutes: 5,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Redirect if not logged in
    if (!userLoading && !user) {
        router.push('/auth');
        return null;
    }

    if (userLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const now = new Date();
        const endTime = new Date(now.getTime() + formData.durationMinutes * 60 * 1000);

        const payload = {
            sellerId: user!.id,
            title: formData.title,
            description: formData.description,
            startPrice: formData.startPrice,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
        };

        try {
            const res = await api.post<Auction>('/auctions', payload);
            // Redirect to the auction detail page
            router.push(`/auctions/${res.data.id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create auction';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Gavel className="h-6 w-6 text-violet-600" />
                Create New Auction
            </h1>

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Vintage Watch Collection"
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the item you're auctioning..."
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Starting Price (cents)
                        </label>
                        <input
                            type="number"
                            required
                            min={100}
                            value={formData.startPrice || ''}
                            onChange={(e) => setFormData({ ...formData, startPrice: parseInt(e.target.value) || 0 })}
                            className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">1000 = $10.00</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                        <select
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                            className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                        >
                            <option value={1}>1 Minute (Quick Test)</option>
                            <option value={5}>5 Minutes</option>
                            <option value={15}>15 Minutes</option>
                            <option value={60}>1 Hour</option>
                            <option value={1440}>24 Hours</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-violet-600 px-4 py-3 text-white font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
                    >
                        {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                        Create Auction
                    </button>
                    <p className="mt-3 text-xs text-slate-500 text-center">
                        After creation, use the CLI to start the auction (make it LIVE).
                    </p>
                </div>
            </form>
        </div>
    );
}
