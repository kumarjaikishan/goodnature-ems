const BASE_URL = import.meta.env.VITE_API_ADDRESS;
// const BASE_URL = "/api/";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve();
    });

    failedQueue = [];
};

export const apiClient = async ({
    url,
    method = "GET",
    body = null,
    params = null,
}) => {

    let token = localStorage.getItem("emstoken");

    const makeRequest = () => {
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

        return fetch(finalUrl, {
            method,
            credentials: "include", // ⭐ IMPORTANT — sends refresh cookie
            headers,
            body: isFormData ? body : (body ? JSON.stringify(body) : null),
        });
    };

    let response = await makeRequest();

    // 🔁 Access token expired
    if (response.status === 401) {
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => apiClient({ url, method, body, params }));
        }

        isRefreshing = true;

        try {
            // 🔐 refresh token comes ONLY from cookie
            // console.log("retrying for refresh token")
            const refreshRes = await fetch(BASE_URL + "refresh", {
                method: "POST",
                credentials: "include" // ⭐ sends cookie
            });

            if (!refreshRes.ok) {
                const err = new Error("Session Expired");
                err.isApiError = true;
                err.status = refreshRes.status;
                throw err;
            } 

            const refreshData = await refreshRes.json();

            // backend returns: { accessToken }
            token = refreshData.accessToken;

            localStorage.setItem("emstoken", token);

            processQueue(null);

            return apiClient({ url, method, body, params });

        } catch (err) {
            processQueue(err);
            localStorage.removeItem("emstoken");
            throw err;
        } finally {
            isRefreshing = false;
        }
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
