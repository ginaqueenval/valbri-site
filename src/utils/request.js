import axios from "axios";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("player_token");
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
        localStorage.removeItem("player_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function getPlayerToken() {
  return localStorage.getItem("player_token");
}

export default request;
