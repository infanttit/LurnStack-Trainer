import axios from "axios";
import { env } from "../config/env";
import { getAuthToken } from "../../auth/model/authStorage";

const baseURL = String(env.apiBaseUrl || "").replace(/\/+$/, "");

export const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers = config.headers || {};
    delete config.headers["Content-Type"];
  }
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with retry logic for transient network errors (e.g. ERR_CONNECTION_CLOSED)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // If config is not defined or request is not retryable, reject immediately
    if (!config) {
      return Promise.reject(error);
    }
    
    // Setup retry state
    config.retryCount = config.retryCount || 0;
    const MAX_RETRIES = 2;
    
    // Detect network/connection drop or transient server errors
    const isNetworkError = !error.response && error.code !== "ERR_CANCELED";
    const isRetryableStatus = error.response && [502, 503, 504].includes(error.response.status);
    
    if ((isNetworkError || isRetryableStatus) && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      
      // Exponential backoff delay (1s, 2s)
      const delay = config.retryCount * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Re-call using client instance
      return axiosClient(config);
    }
    
    return Promise.reject(error);
  }
);
