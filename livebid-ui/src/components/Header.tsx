'use client';

import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { formatCurrency } from '@/lib/api';
import { Gavel, User as UserIcon, LogOut } from 'lucide-react';

export default function Header() {
    const { user, logout } = useUser();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-bold text-violet-600 hover:text-violet-700 transition-colors"
                >
                    <Gavel className="h-6 w-6" />
                    <span>LiveBid</span>
                </Link>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link
                                href="/auctions/create"
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                + Create Auction
                            </Link>

                            <div className="h-5 w-px bg-slate-200" />

                            {/* Balance Display */}
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-slate-500">Balance</span>
                                <span className="font-mono font-semibold text-emerald-600">
                                    {formatCurrency(user.availableBalance)}
                                </span>
                            </div>

                            {/* Profile & Logout */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/profile"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors"
                                    title="Profile"
                                >
                                    <UserIcon className="h-4 w-4" />
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/auth"
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
