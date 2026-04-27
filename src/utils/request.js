import axios from "axios";
import {
  clearStoredPlayerSession,
  getStoredPlayerToken,
} from "./playerAuth.js";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});

request.interceptors.request.use(
  (config) => {
    const token = getStoredPlayerToken();
    if (token) {
      config.headers["X-Player-Token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code === 200) {
      return data;
    }
    return Promise.reject(new Error(data.msg || "Request failed"));
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        clearStoredPlayerSession({
          reason: "expired",
          notifySessionExpired: error.config?.skipSessionExpiredPrompt !== true,
        });
      }
    }
    return Promise.reject(error);
  },
);

export function getPlayerToken() {
  return getStoredPlayerToken();
}

export default request;
