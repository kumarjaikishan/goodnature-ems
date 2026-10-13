import { clearAuthSession } from "./auth";

const BASE_URL = import.meta.env.VITE_API_ADDRESS;

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

    const response = await fetch(finalUrl, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : null),
    });

    // 401 = session expired or invalid token → purge storage and clean redirect
    if (response.status === 401) {
        clearAuthSession(null, true);
        throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!response.ok) {
        const err = new Error(data.message || "Request failed");
        err.isApiError = true;
        err.status = response.status;
        err.payload = data;
        throw err;
    }

    // ✅ success response
    return data;
};
