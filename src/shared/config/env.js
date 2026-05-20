const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const env = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || (isLocalhost ? "" : "https://api.lurnstack.com"),
};
