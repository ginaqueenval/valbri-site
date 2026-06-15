import { useEffect, useRef, useCallback } from "react";
import {
  getStoredPlayerToken,
  PLAYER_AUTH_CHANGED_EVENT,
} from "../utils/playerAuth";
import { createOrderStreamToken } from "../api/order";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const MAX_RETRIES = 3;
const FALLBACK_POLL_INTERVAL_MS = 30000;
const HIDDEN_SUSPEND_DELAY_MS = 30000;

export default function useOrderSse(onStatusChange) {
  const sourceRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const hiddenTimerRef = useRef(null);
  const suspendedRef = useRef(false);
  const connectGenerationRef = useRef(0);
  const onStatusChangeRef = useRef(onStatusChange);
  const connectRef = useRef(null);

  // Keep refs in sync with latest values (outside render via effect)
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    connectGenerationRef.current += 1;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  const startFallbackPolling = useCallback(() => {
    if (fallbackTimerRef.current) return;
    fallbackTimerRef.current = setInterval(() => {
      onStatusChangeRef.current?.({ fallback: true });
    }, FALLBACK_POLL_INTERVAL_MS);
  }, []);

  const scheduleRetry = useCallback(() => {
    const retries = retryCountRef.current;
    if (retries < MAX_RETRIES) {
      retryCountRef.current = retries + 1;
      const delayMs = 1000 * Math.pow(2, retries);
      retryTimerRef.current = setTimeout(() => connectRef.current?.(), delayMs);
    } else {
      startFallbackPolling();
    }
  }, [startFallbackPolling]);

  const connect = useCallback(async () => {
    close();
    if (!getStoredPlayerToken()) return;
    stopFallbackPolling();
    suspendedRef.current = false;

    const generation = ++connectGenerationRef.current;

    let streamToken;
    try {
      const res = await createOrderStreamToken();
      if (generation !== connectGenerationRef.current) return;
      streamToken = res?.data?.streamToken;
    } catch {
      if (generation !== connectGenerationRef.current) return;
      scheduleRetry();
      return;
    }
    if (!streamToken) {
      scheduleRetry();
      return;
    }

    const url = `${API_BASE}/valbri/orders/stream/${encodeURIComponent(streamToken)}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.addEventListener("connected", () => {
      retryCountRef.current = 0;
      stopFallbackPolling();
    });

    source.addEventListener("orderStatusChange", (event) => {
      try {
        const data = JSON.parse(event.data);
        onStatusChangeRef.current?.(data);
      } catch {
        // ignore malformed payload
      }
    });

    source.onerror = () => {
      if (generation !== connectGenerationRef.current) return;
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      scheduleRetry();
    };
  }, [close, scheduleRetry, stopFallbackPolling]);

  // Keep connectRef in sync with latest connect
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const clearHiddenTimer = useCallback(() => {
    if (hiddenTimerRef.current) {
      clearTimeout(hiddenTimerRef.current);
      hiddenTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    const handleAuthChange = (event) => {
      retryCountRef.current = 0;
      stopFallbackPolling();
      clearHiddenTimer();
      if (event?.detail?.isLoggedIn === false) {
        close();
      } else {
        connect();
      }
    };
    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        clearHiddenTimer();
        hiddenTimerRef.current = setTimeout(() => {
          hiddenTimerRef.current = null;
          stopFallbackPolling();
          close();
          suspendedRef.current = true;
        }, HIDDEN_SUSPEND_DELAY_MS);
      } else {
        clearHiddenTimer();
        if (suspendedRef.current) {
          suspendedRef.current = false;
          retryCountRef.current = 0;
          connect();
          onStatusChangeRef.current?.({ fallback: true });
        }
      }
    };
    window.addEventListener(PLAYER_AUTH_CHANGED_EVENT, handleAuthChange);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return () => {
      window.removeEventListener(PLAYER_AUTH_CHANGED_EVENT, handleAuthChange);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      clearHiddenTimer();
      stopFallbackPolling();
      close();
    };
  }, [connect, close, stopFallbackPolling, clearHiddenTimer]);

  return { reconnect: connect, disconnect: close };
}
