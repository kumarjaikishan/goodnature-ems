// src/utils/sse.js

let eventSource = null;
let reconnectTimeout = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 10000;

export const connectSSE = (onMessage, onError) => {
    if (eventSource) return eventSource; // Prevent multiple active connections

    const token = localStorage.getItem("emstoken");
    if (!token) return null;

    const url = `${import.meta.env.VITE_SSE_ADDRESS}events?token=${token}`;
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
        console.log("✅ SSE connected from utils");
        reconnectDelay = 1000; // Reset retry delay on success
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
        console.warn(`⚠️ SSE error, retrying in ${reconnectDelay}ms`, err);
        
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }

        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        
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
        console.log("❌ SSE disconnected");
    }
};
