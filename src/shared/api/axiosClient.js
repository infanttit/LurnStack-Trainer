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
