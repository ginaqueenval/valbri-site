import axios from "axios";
import {
  clearStoredPlayerSession,
  getStoredPlayerToken,
} from "./playerAuth.js";
import { createBusinessError } from "./requestError.js";

let sessionClearing = false;

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
    if (response.config?.responseType === "blob" || response.config?.responseType === "arraybuffer") {
      return response.data;
    }
    const { data } = response;
    if (data.code === 200) {
      return data;
    }
    return Promise.reject(createBusinessError(response));
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401 && !sessionClearing && getStoredPlayerToken()) {
        sessionClearing = true;
        clearStoredPlayerSession({
          reason: "expired",
          notifySessionExpired: error.config?.skipSessionExpiredPrompt !== true,
        });
        // Reset after a tick so future logins can trigger 401 handling again
        queueMicrotask(() => { sessionClearing = false; });
      }
    }
    return Promise.reject(error);
  },
);

export default request;
