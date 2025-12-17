'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2, Gavel } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AuthPage() {
    const router = useRouter();
    const { user, isLoading, loginWithGoogle } = useUser();
    const [error, setError] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (!isLoading && user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    const googleLogin = useGoogleLogin({
        flow: 'implicit',
        onSuccess: async (response) => {
            setIsSigningIn(true);
            setError('');
            try {
                // Exchange access token for ID token via Google's tokeninfo endpoint
                const tokenInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${response.access_token}`);
                const data = await tokenInfo.json();

                if (data.error) {
                    throw new Error(data.error_description || 'Failed to verify token');
                }

                // For implicit flow, we need to use the access_token to get user info
                // Then send it to our backend to create/find user
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` }
                });
                const userInfo = await userInfoRes.json();

                // Our backend expects an ID token, but we're using access token flow
                // Let's adjust - we'll send the access token and verify on backend
                await loginWithGoogle(response.access_token);
                router.push('/');
            } catch (err) {
                console.error('Login failed:', err);
                setError('Failed to sign in with Google. Please try again.');
            } finally {
                setIsSigningIn(false);
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
            setError('Google sign-in was cancelled or failed.');
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
                            <Gavel className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to LiveBid</h1>
                    <p className="mt-2 text-gray-500">Sign in to start bidding on auctions</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Google Sign In */}
                <button
                    onClick={() => googleLogin()}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    {isSigningIn ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    Continue with Google
                </button>

                <p className="text-center text-xs text-gray-400">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
