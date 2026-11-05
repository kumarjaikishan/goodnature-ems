// utils/useApi.js

import { useState } from "react";
import { toast } from "./toast";
import { useNavigate } from "react-router-dom";
import { apiClient } from "./apiClient";

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const request = async (config) => {
        let { url, method } = config;

        try {
            setLoading(true);
            setError(null);

            let start = performance.now();
            const result = await apiClient(config);
            let end = performance.now();

            const logDetail = {
                endpoint: url,
                method: method || "GET",
                time: (end - start).toFixed(2) + ' ms',
                date: new Date(),
                date1: Date.now()
            };
            logger(logDetail);

            setData(result);
            return result;

        } catch (err) {
            let userMessage = err.message || "Unexpected error occurred";

            // Sanitize raw technical errors / parser syntax errors before displaying to user
            if (
                userMessage.includes("Unexpected token") ||
                userMessage.includes("is not valid JSON") ||
                userMessage.includes("JSON.parse")
            ) {
                userMessage = "Server unavailable. Please try again later.";
            } else if (
                userMessage.includes("Failed to fetch") ||
                userMessage.includes("NetworkError") ||
                userMessage.includes("Load failed")
            ) {
                userMessage = "Server unavailable. Please try again later.";
            }

            setError(userMessage);
            console.error("API Request Error:", err);

            const currentPath = window.location.pathname;
            const isAuthPage = currentPath === "/logout" || currentPath === "/login";
            const msg = (userMessage || "").toLowerCase();
            
            // Only 401 (Unauthorized / Invalid or Expired Token) should force a redirect to /logout.
            // 403 (Forbidden / Permission Denied) is an RBAC restriction; the user remains logged in.
            const isAuthFailure =
                err?.status === 401 ||
                msg.includes("jwt expired") ||
                msg.includes("session expired") ||
                msg.includes("unauthorized");

            if (err.isApiError && !isAuthPage) {
                toast.warn(userMessage, { autoClose: 3500, toastId: isAuthFailure ? "auth-toast" : undefined });
            } else if (!isAuthPage) {
                toast.error(userMessage, { toastId: isAuthFailure ? "auth-toast" : undefined });
            }

            if (isAuthFailure && currentPath !== "/logout") {
                navigate("/logout", { replace: true });
            }

            const cleanErr = new Error(userMessage);
            cleanErr.status = err.status;
            cleanErr.isApiError = err.isApiError;
            cleanErr.payload = err.payload;
            throw cleanErr;
        } finally {
            setLoading(false);
        }
    };

    return { request, loading, error, data };
};

const logger = (detail) => {
    const prev = JSON.parse(localStorage.getItem("apiLogs")) || [];

    const key = `${detail.method}_${detail.endpoint}`;

    // Separate current API logs and others
    const sameApi = prev.filter(
        log => `${log.method}_${log.endpoint}` === key
    );

    const otherApis = prev.filter(
        log => `${log.method}_${log.endpoint}` !== key
    );

    // Add new log
    const updatedSameApi = [...sameApi, detail];

    // Keep only last 10
    const trimmedSameApi = updatedSameApi.slice(-10);

    const finalLogs = [...otherApis, ...trimmedSameApi];

    localStorage.setItem("apiLogs", JSON.stringify(finalLogs));
};

