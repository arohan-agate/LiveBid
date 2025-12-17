'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { Bell, Check, Gavel, DollarSign, AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function NotificationBell() {
    const router = useRouter();
    const { user } = useUser();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
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

    // Fetch notifications when user changes
    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get<Notification[]>(`/users/${user.id}/notifications`);
            setNotifications(res.data.slice(0, 10)); // Show latest 10
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await api.get<{ count: number }>(`/users/${user.id}/notifications/unread-count`);
            setUnreadCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    const markAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            await api.post(`/users/${user.id}/notifications/${notificationId}/read`);
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await api.post(`/users/${user.id}/notifications/mark-all-read`);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setShowDropdown(false);
        if (notification.auctionId) {
            router.push(`/auctions/${notification.auctionId}`);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'OUTBID':
                return <AlertCircle className="h-4 w-4 text-amber-500" />;
            case 'AUCTION_WON':
                return <ShoppingBag className="h-4 w-4 text-green-500" />;
            case 'SALE_COMPLETE':
                return <DollarSign className="h-4 w-4 text-green-500" />;
            default:
                return <Gavel className="h-4 w-4 text-indigo-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) fetchNotifications(); }}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-indigo-50/50' : ''}`}
                                >
                                    <div className="mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <Link
                            href="/profile"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-3 text-center text-sm text-indigo-600 hover:bg-gray-50 border-t border-gray-100"
                        >
                            View all activity
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
