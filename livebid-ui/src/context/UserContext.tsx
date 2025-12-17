'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

interface BalanceChangedEvent {
    userId: string;
    availableBalance: number;
    reservedBalance: number;
}

interface UserContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    loginWithGoogle: (idToken: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const WS_URL = 'http://localhost:8080/ws';

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const stompClient = useRef<Client | null>(null);

    // Set auth header when token changes
    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const fetchUser = useCallback(async (userId: string) => {
        try {
            const res = await api.get<User>(`/users/${userId}`);
            setUser(res.data);
            return res.data;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            return null;
        }
    }, []);

    // Connect to WebSocket for user balance updates
    const connectWebSocket = useCallback((userId: string) => {
        if (stompClient.current?.active) {
            stompClient.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
            reconnectDelay: 5000,

            onConnect: () => {
                console.log('[UserContext] WebSocket connected');

                client.subscribe(`/topic/users/${userId}`, (message: IMessage) => {
                    try {
                        const event: BalanceChangedEvent = JSON.parse(message.body);
                        setUser((prev) => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                availableBalance: event.availableBalance,
                                reservedBalance: event.reservedBalance,
                            };
                        });
                    } catch (e) {
                        console.error('[UserContext] Failed to parse balance update:', e);
                    }
                });
            },
        });

        client.activate();
        stompClient.current = client;
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (stompClient.current?.active) {
            stompClient.current.deactivate();
            stompClient.current = null;
        }
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('livebid_token');
        const storedUser = localStorage.getItem('livebid_user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser) as User;
                setToken(storedToken);
                setUser(parsedUser);
                connectWebSocket(parsedUser.id);
            } catch {
                localStorage.removeItem('livebid_token');
                localStorage.removeItem('livebid_user');
            }
        }
        setIsLoading(false);

        return () => {
            disconnectWebSocket();
        };
    }, [connectWebSocket, disconnectWebSocket]);

    const loginWithGoogle = async (idToken: string) => {
        setIsLoading(true);
        try {
            const res = await api.post<{ token: string; user: User }>('/auth/google', { idToken });
            const { token: jwt, user: userData } = res.data;

            localStorage.setItem('livebid_token', jwt);
            localStorage.setItem('livebid_user', JSON.stringify(userData));

            setToken(jwt);
            setUser(userData);
            connectWebSocket(userData.id);
        } catch (error) {
            console.error('Google login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('livebid_token');
        localStorage.removeItem('livebid_user');
        setToken(null);
        setUser(null);
        disconnectWebSocket();
    };

    const refreshUser = async () => {
        if (user) {
            await fetchUser(user.id);
        }
    };

    return (
        <UserContext.Provider value={{ user, token, isLoading, loginWithGoogle, logout, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
