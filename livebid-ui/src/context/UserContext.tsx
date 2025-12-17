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
    isLoading: boolean;
    login: (userId: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const WS_URL = 'http://localhost:8080/ws';

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const stompClient = useRef<Client | null>(null);

    const fetchUser = useCallback(async (userId: string) => {
        try {
            const res = await api.get<User>(`/users/${userId}`);
            setUser(res.data);
            localStorage.setItem('livebid_user_id', userId);
            return res.data;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('livebid_user_id');
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
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

                // Subscribe to user-specific balance updates
                client.subscribe(`/topic/users/${userId}`, (message: IMessage) => {
                    try {
                        const event: BalanceChangedEvent = JSON.parse(message.body);
                        console.log('[UserContext] Balance update received:', event);

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

            onStompError: (frame) => {
                console.error('[UserContext] STOMP error:', frame.headers['message']);
            },
        });

        client.activate();
        stompClient.current = client;
    }, []);

    // Disconnect WebSocket
    const disconnectWebSocket = useCallback(() => {
        if (stompClient.current?.active) {
            stompClient.current.deactivate();
            stompClient.current = null;
            console.log('[UserContext] WebSocket disconnected');
        }
    }, []);

    useEffect(() => {
        // Check localStorage on mount
        const storedId = localStorage.getItem('livebid_user_id');
        if (storedId) {
            fetchUser(storedId).then((userData) => {
                if (userData) {
                    connectWebSocket(storedId);
                }
            });
        } else {
            setIsLoading(false);
        }

        // Cleanup on unmount
        return () => {
            disconnectWebSocket();
        };
    }, [fetchUser, connectWebSocket, disconnectWebSocket]);

    const login = async (userId: string) => {
        setIsLoading(true);
        const userData = await fetchUser(userId);
        if (userData) {
            connectWebSocket(userId);
        }
    };

    const logout = () => {
        localStorage.removeItem('livebid_user_id');
        setUser(null);
        disconnectWebSocket();
    };

    const refreshUser = async () => {
        const storedId = localStorage.getItem('livebid_user_id');
        if (storedId) {
            await fetchUser(storedId);
        }
    };

    return (
        <UserContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
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
