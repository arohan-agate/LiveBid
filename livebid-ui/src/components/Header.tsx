'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { formatCurrency } from '@/lib/api';
import { Gavel, Plus, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
    const pathname = usePathname();
    const { user, logout } = useUser();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinks = [
        { href: '/', label: 'Browse Auctions' },
        { href: '/auctions/create', label: 'Sell an Item' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xl font-bold text-gray-900"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                            <Gavel className="h-4 w-4 text-white" />
                        </div>
                        <span>LiveBid</span>
                    </Link>

                    {/* Center Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                {/* Mobile: Create Button */}
                                <Link
                                    href="/auctions/create"
                                    className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white"
                                >
                                    <Plus className="h-5 w-5" />
                                </Link>

                                {/* User Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <div className="text-gray-900 font-medium truncate max-w-[100px]">
                                                {user.email.split('@')[0]}
                                            </div>
                                            <div className="text-xs text-green-600 font-mono">
                                                {formatCurrency(user.availableBalance)}
                                            </div>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm text-gray-500">Signed in as</p>
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                                            </div>

                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Available</span>
                                                    <span className="font-mono text-green-600">{formatCurrency(user.availableBalance)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-gray-500">In Escrow</span>
                                                    <span className="font-mono text-amber-600">{formatCurrency(user.reservedBalance)}</span>
                                                </div>
                                            </div>

                                            <Link
                                                href="/profile"
                                                onClick={() => setShowDropdown(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                My Profile & Auctions
                                            </Link>

                                            <button
                                                onClick={() => { logout(); setShowDropdown(false); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/auth"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth"
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
