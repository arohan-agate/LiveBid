'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { formatCurrency } from '@/lib/api';
import { User, Wallet, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading, logout, refreshUser } = useUser();
    const [copied, setCopied] = useState(false);

    // Redirect if not logged in
    if (!isLoading && !user) {
        router.push('/auth');
        return null;
    }

    if (isLoading || !user) {
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
        <div className="mx-auto max-w-2xl py-8 space-y-8">
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

            <p className="text-sm text-slate-500 text-center">
                💡 Tip: Use the CLI tool (<code className="bg-slate-100 px-1 rounded">python cli.py</code>) to add funds to your account.
            </p>
        </div>
    );
}
