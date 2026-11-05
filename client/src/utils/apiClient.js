import { clearAuthSession } from "./auth";

const BASE_URL = import.meta.env.VITE_API_ADDRESS;

/**
 * Maps standard HTTP status codes to user-friendly messages when the server returns HTML/non-JSON or proxy error pages.
 */
const getStatusErrorMessage = (status) => {
    switch (status) {
        case 502:
        case 503:
        case 504:
            return "Server unavailable. Please try again later.";
        case 500:
            return "Something went wrong. Please try again.";
        case 404:
            return "Requested service not found.";
        case 403:
            return "Access denied.";
        default:
            return "Server error. Please try again.";
    }
};

export const apiClient = async ({
    url,
    method = "GET",
    body = null,
    params = null,
}) => {
    const token = localStorage.getItem("emstoken");

    const isFormData = body instanceof FormData;
    const headers = {
        Authorization: token ? `Bearer ${token}` : "",
    };

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    let finalUrl = BASE_URL + url;
    if (params) {
        const query = new URLSearchParams(params).toString();
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + query;
    }

    let response;
    try {
        const fetchOptions = { method, headers };
        if (method !== "GET" && method !== "HEAD") {
            fetchOptions.body = isFormData ? body : (body ? JSON.stringify(body) : null);
        }
        response = await fetch(finalUrl, fetchOptions);
    } catch (networkErr) {
        // Network connection failure (e.g. server port wrong, connection refused, offline)
        const err = new Error("Server unavailable. Please try again later.");
        err.isNetworkError = true;
        err.originalError = networkErr;
        throw err;
    }

    // 401 = session expired or invalid token → purge storage and clean redirect
    if (response.status === 401) {
        clearAuthSession(null, true);
        throw new Error('Session expired. Please log in again.');
    }

    // Safely parse JSON or handle HTML/proxy responses without throwing SyntaxError
    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch {
            data = null;
        }
    } else {
        // If server returned HTML (e.g. 502/504 Bad Gateway, Nginx error, Vite fallback)
        try {
            await response.text();
        } catch {
            // Ignore text read error
        }
    }

    if (!response.ok) {
        const fallbackMsg = getStatusErrorMessage(response.status);
        const errMsg = data?.message || data?.error || fallbackMsg;
        const err = new Error(errMsg);
        err.isApiError = true;
        err.status = response.status;
        err.payload = data;
        throw err;
    }

    // If server responded with 200 OK but body wasn't valid JSON (e.g. misconfigured reverse proxy serving index.html)
    if (data === null && !contentType.includes("application/json")) {
        throw new Error("Received an unexpected response from server. Please verify API configuration.");
    }

    // ✅ success response
    return data;
};
