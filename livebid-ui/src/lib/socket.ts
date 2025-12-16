import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { BidPlacedEvent, AuctionClosedEvent } from './types';

const WS_URL = 'http://localhost:8080/ws';

/**
 * Connect to a specific auction's WebSocket topic.
 * Uses SockJS to match the backend's .withSockJS() configuration.
 */
export function connectToAuction(
    auctionId: string,
    onBidUpdate: (data: BidPlacedEvent) => void,
    onAuctionClosed: (data: AuctionClosedEvent) => void,
    onConnect?: () => void,
    onError?: (error: string) => void
): Client {
    const client = new Client({
        // KEY: Use SockJS factory instead of raw WebSocket
        webSocketFactory: () => new SockJS(WS_URL) as WebSocket,

        reconnectDelay: 5000,

        onConnect: () => {
            console.log('[WebSocket] Connected to', WS_URL);

            // Subscribe to this auction's topic
            client.subscribe(`/topic/auctions/${auctionId}`, (message: IMessage) => {
                try {
                    const body = JSON.parse(message.body);
                    console.log('[WebSocket] Received:', body);

                    // Determine event type by checking fields
                    if ('newLeaderId' in body && 'newPrice' in body) {
                        onBidUpdate(body as BidPlacedEvent);
                    } else if ('winnerId' in body && 'closingPrice' in body) {
                        onAuctionClosed(body as AuctionClosedEvent);
                    }
                } catch (e) {
                    console.error('[WebSocket] Failed to parse message:', e);
                }
            });

            if (onConnect) onConnect();
        },

        onStompError: (frame) => {
            console.error('[WebSocket] STOMP error:', frame.headers['message']);
            if (onError) onError(frame.headers['message'] || 'Unknown STOMP error');
        },

        onWebSocketClose: () => {
            console.log('[WebSocket] Connection closed');
        },
    });

    client.activate();
    return client;
}

/**
 * Disconnect the STOMP client gracefully.
 */
export function disconnectFromAuction(client: Client | null): void {
    if (client && client.active) {
        client.deactivate();
        console.log('[WebSocket] Disconnected');
    }
}
