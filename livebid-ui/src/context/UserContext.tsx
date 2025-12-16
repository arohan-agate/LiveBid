'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    login: (userId: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check localStorage on mount
        const storedId = localStorage.getItem('livebid_user_id');
        if (storedId) {
            fetchUser(storedId);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async (userId: string) => {
        try {
            const res = await api.get<User>(`/users/${userId}`);
            setUser(res.data);
            localStorage.setItem('livebid_user_id', userId);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('livebid_user_id');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userId: string) => {
        setIsLoading(true);
        await fetchUser(userId);
    };

    const logout = () => {
        localStorage.removeItem('livebid_user_id');
        setUser(null);
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
