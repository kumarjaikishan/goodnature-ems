// src/utils/sse.js

let eventSource = null;
let reconnectTimeout = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30000;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5; // Stop retrying after 5 consecutive failures (auth issue)

export const connectSSE = (onMessage, onError) => {
    if (eventSource) return eventSource; // Prevent multiple active connections

    const token = localStorage.getItem("emstoken");
    if (!token) return null; // No token — don't connect

    const url = `${import.meta.env.VITE_SSE_ADDRESS}events?token=${token}`;
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
        reconnectDelay = 1000; // Reset retry delay on success
        consecutiveFailures = 0; // Reset failure count on successful connect
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (onMessage) onMessage(data);
        } catch (err) {
            console.error("SSE parse error:", err);
        }
    };

    eventSource.onerror = (err) => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }

        if (reconnectTimeout) clearTimeout(reconnectTimeout);

        // Stop reconnecting if token is gone (logged out) or too many consecutive failures
        // (which indicates an auth problem like invalid signature after JWT rotation)
        const currentToken = localStorage.getItem("emstoken");
        consecutiveFailures++;

        if (!currentToken || consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            consecutiveFailures = 0;
            if (onError) onError(err);
            return; // Stop retrying — auth failure or logged out
        }

        reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
            connectSSE(onMessage, onError);
        }, reconnectDelay);

        if (onError) onError(err);
    };

    return eventSource;
};

export const closeSSE = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }

    consecutiveFailures = 0;
    reconnectDelay = 1000;
};
