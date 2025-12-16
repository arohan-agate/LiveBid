'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { User } from '@/lib/types';
import { UserPlus, LogIn, Loader2 } from 'lucide-react';

export default function AuthPage() {
    const router = useRouter();
    const { login } = useUser();

    const [email, setEmail] = useState('');
    const [existingId, setExistingId] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState('');

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsCreating(true);

        try {
            const userEmail = email || `demo${Date.now()}@livebid.test`;
            const res = await api.post<User>('/users', { email: userEmail });
            await login(res.data.id);
            router.push('/profile');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create user';
            setError(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!existingId.trim()) {
            setError('Please enter a User ID');
            return;
        }

        setIsLoggingIn(true);
        try {
            await login(existingId.trim());
            router.push('/');
        } catch {
            setError('User not found. Check the ID and try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="mx-auto max-w-md space-y-8 py-12">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to LiveBid</h1>
                <p className="mt-2 text-slate-600">Create an account or sign in to start bidding</p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Create New User */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                        <UserPlus className="h-5 w-5 text-violet-600" />
                        New User (Demo)
                    </h2>
                    <form onSubmit={handleCreateUser}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email or leave blank"
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-white font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create User & Login
                        </button>
                    </form>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-slate-50 px-2 text-slate-500">Or continue with ID</span>
                    </div>
                </div>

                {/* Login with Existing ID */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                        <LogIn className="h-5 w-5 text-slate-600" />
                        Existing User ID
                    </h2>
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <input
                                type="text"
                                value={existingId}
                                onChange={(e) => setExistingId(e.target.value)}
                                placeholder="UUID (e.g. 550e8400-e29b-...)"
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-violet-500 focus:ring-violet-500 font-mono text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
