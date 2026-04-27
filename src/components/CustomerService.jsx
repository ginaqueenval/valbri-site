import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  bindCustomerPlayer,
  createCustomerStreamToken,
  getCustomerMessages,
  initCustomerSession,
  markCustomerRead,
  sendCustomerMessage,
} from "../api/cs";
import { getPlayerToken } from "../utils/request";
import {
  buildCustomerStreamUrl,
  isCustomerSessionAccessDenied,
  isCustomerSessionClosed,
  normalizeCustomerServiceNotice,
  normalizeVisitorToken,
  resolveCustomerVisitorToken,
  upsertCustomerMessage,
} from "../utils/customerServiceState";
import {
  CUSTOMER_SERVICE_FLOATING_GAP,
  CUSTOMER_SERVICE_FLOATING_STORAGE_KEY,
  CUSTOMER_SERVICE_MOBILE_BREAKPOINT,
  getDefaultFloatingPosition,
  getDesktopPanelPosition,
  normalizeFloatingPosition,
  parseStoredFloatingPosition,
} from "../utils/customerServiceFloating.js";

const VISITOR_TOKEN_KEY = "cs_visitor_token";
const PLAYER_HISTORY_REVEALED_PREFIX = "cs_player_history_revealed:";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const DESKTOP_BUTTON_SIZE = 60;
const MOBILE_BUTTON_SIZE = 58;
const DESKTOP_PADDING = 18;
const MOBILE_PADDING = 14;
const DESKTOP_PANEL_WIDTH = 400;
const MAX_MESSAGE_LENGTH = 500;

function getViewportSnapshot() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function getLauncherConfig(viewportWidth) {
  const mobile = viewportWidth < CUSTOMER_SERVICE_MOBILE_BREAKPOINT;
  return {
    mobile,
    buttonSize: mobile ? MOBILE_BUTTON_SIZE : DESKTOP_BUTTON_SIZE,
    padding: mobile ? MOBILE_PADDING : DESKTOP_PADDING,
  };
}

function getInitialLauncherPosition() {
  const viewport = getViewportSnapshot();
  const config = getLauncherConfig(viewport.width);
  if (typeof window === "undefined") {
    return getDefaultFloatingPosition(viewport, config);
  }
  const stored = parseStoredFloatingPosition(
    window.localStorage.getItem(CUSTOMER_SERVICE_FLOATING_STORAGE_KEY),
  );
  return normalizeFloatingPosition(stored, viewport, config);
}

function buildPlayerHistoryRevealedKey(playerToken) {
  return `${PLAYER_HISTORY_REVEALED_PREFIX}${playerToken}`;
}

function shouldCollapsePlayerHistory(playerToken) {
  if (!playerToken || typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(buildPlayerHistoryRevealedKey(playerToken)) !== "1";
}

function markPlayerHistoryRevealed(playerToken) {
  if (!playerToken || typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(buildPlayerHistoryRevealedKey(playerToken), "1");
}

function SupportIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.75 9.75a5.25 5.25 0 1 1 10.5 0v3.3a1.95 1.95 0 0 1-1.95 1.95H14.4a1.2 1.2 0 0 0-1.2 1.2v.1a1.95 1.95 0 1 1-3.9 0v-1.16" />
      <path d="M6.75 14.25h-.45a1.8 1.8 0 0 1-1.8-1.8v-1.8a1.8 1.8 0 0 1 1.8-1.8h.45" />
      <path d="M17.25 9h.45a1.8 1.8 0 0 1 1.8 1.8v1.8a1.8 1.8 0 0 1-1.8 1.8h-.45" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M4.25 10a.75.75 0 0 1 .75-.75h10a.75.75 0 1 1 0 1.5H5A.75.75 0 0 1 4.25 10Z" />
    </svg>
  );
}

function HistoryChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-[#9EFED1]"
    >
      <path d="M4.5 7.25 10 12.75l5.5-5.5" />
    </svg>
  );
}

export default function CustomerService() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState(null);
  const [visitorToken, setVisitorToken] = useState(() =>
    normalizeVisitorToken(localStorage.getItem(VISITOR_TOKEN_KEY)),
  );
  const [unread, setUnread] = useState(0);
  const [notice, setNotice] = useState("");
  const [polling, setPolling] = useState(false);
  const [viewport, setViewport] = useState(() => getViewportSnapshot());
  const [launcherPosition, setLauncherPosition] = useState(() =>
    getInitialLauncherPosition(),
  );
  const [dragging, setDragging] = useState(false);
  const [historyCutoffId, setHistoryCutoffId] = useState(null);

  const streamRef = useRef(null);
  const pollingRef = useRef(null);
  const messageBoxRef = useRef(null);
  const launcherRef = useRef(null);
  const panelRef = useRef(null);
  const dragStateRef = useRef(null);
  const launcherPositionRef = useRef(launcherPosition);
  const viewportRef = useRef(viewport);
  const suppressToggleRef = useRef(false);
  const openRef = useRef(open);
  const ignoreNextStreamErrorRef = useRef(false);
  const ensuringSessionRef = useRef(false);

  const playerToken = getPlayerToken();
  const effectiveVisitorToken = resolveCustomerVisitorToken(visitorToken, session);
  const visibleMessages =
    historyCutoffId == null
      ? messages
      : messages.filter((message) => Number(message?.id || 0) > historyCutoffId);
  const hasCollapsedHistory =
    historyCutoffId != null &&
    messages.some((message) => Number(message?.id || 0) <= historyCutoffId);
  const launcherConfig = getLauncherConfig(viewport.width);
  const launcherSize = launcherConfig.buttonSize;
  const isMobile = launcherConfig.mobile;
  const desktopPanelHeight = Math.min(Math.round(viewport.height * 0.78), 640);
  const desktopPanelPosition = !isMobile
    ? getDesktopPanelPosition(launcherPosition, viewport, {
        buttonSize: launcherSize,
        panelWidth: DESKTOP_PANEL_WIDTH,
        panelHeight: desktopPanelHeight,
        padding: launcherConfig.padding,
        gap: CUSTOMER_SERVICE_FLOATING_GAP,
      })
    : null;

  const handlePointerMove = useCallback((event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragState.moved = true;
    }
    const nextViewport = viewportRef.current;
    const nextPosition = normalizeFloatingPosition(
      {
        x: dragState.origin.x + deltaX,
        y: dragState.origin.y + deltaY,
      },
      nextViewport,
      getLauncherConfig(nextViewport.width),
    );
    setLauncherPosition(nextPosition);
  }, []);

  const handlePointerUp = useCallback((event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    if (dragState.moved) {
      suppressToggleRef.current = true;
      window.setTimeout(() => {
        suppressToggleRef.current = false;
      }, 0);
    }
    dragStateRef.current = null;
    setDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove]);

  const removePointerListeners = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, handlePointerUp]);

  const handleLauncherPointerDown = useCallback((event) => {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: launcherPositionRef.current,
      moved: false,
    };
    setDragging(true);
    removePointerListeners();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, handlePointerUp, removePointerListeners]);

  useEffect(() => {
    launcherPositionRef.current = launcherPosition;
  }, [launcherPosition]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (visitorToken) {
      localStorage.setItem(VISITOR_TOKEN_KEY, visitorToken);
      return;
    }
    localStorage.removeItem(VISITOR_TOKEN_KEY);
  }, [visitorToken]);

  useEffect(() => {
    localStorage.setItem(
      CUSTOMER_SERVICE_FLOATING_STORAGE_KEY,
      JSON.stringify(launcherPosition),
    );
  }, [launcherPosition]);

  useEffect(() => {
    const handleResize = () => {
      const nextViewport = getViewportSnapshot();
      setViewport(nextViewport);
      setLauncherPosition((current) =>
        normalizeFloatingPosition(current, nextViewport, getLauncherConfig(nextViewport.width)),
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      messageBoxRef.current?.scrollTo({
        top: messageBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [messages, open]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!open || isMobile) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      if (
        launcherRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobile, open]);

  useEffect(() => {
    if (!open || !session) {
      return;
    }
    setUnread(0);
    markCustomerRead(
      session.id || session.conversationId,
      effectiveVisitorToken,
    ).catch((error) => {
      setNotice(
        normalizeCustomerServiceNotice(
          error?.message || t("cs.loadFailed"),
          t,
        ),
      );
    });
  }, [effectiveVisitorToken, open, session, t]);

  function resetSessionIdentity() {
    setSession(null);
    setMessages([]);
    setHistoryCutoffId(null);
    setVisitorToken(null);
    setInput("");
  }

  function collapseExistingHistory(nextSession, list) {
    if (!Array.isArray(list) || list.length === 0) {
      setHistoryCutoffId(null);
      return;
    }
    const latestMessageId = list.reduce(
      (maxId, message) => Math.max(maxId, Number(message?.id || 0)),
      0,
    );
    const shouldCollapseGuestHistory = nextSession?.sourceType === "guest" && list.length > 0;
    const shouldCollapsePlayerExistingHistory =
      nextSession?.sourceType === "player" && list.length > 0 && shouldCollapsePlayerHistory(playerToken);

    if (shouldCollapseGuestHistory || shouldCollapsePlayerExistingHistory) {
      setHistoryCutoffId(latestMessageId);
      return;
    }
    setHistoryCutoffId(null);
  }

  function revealHistory() {
    if (session?.sourceType === "player") {
      markPlayerHistoryRevealed(playerToken);
    }
    setHistoryCutoffId(null);
  }

  function handleCustomerServiceError(errorMessage, fallbackMessageKey) {
    if (isCustomerSessionAccessDenied(errorMessage)) {
      resetSessionIdentity();
    }
    setNotice(
      normalizeCustomerServiceNotice(
        errorMessage || t(fallbackMessageKey),
        t,
      ),
    );
  }

  async function ensureSession() {
    if (ensuringSessionRef.current) {
      return;
    }
    ensuringSessionRef.current = true;
    setLoading(true);
    try {
      const initRes = await initCustomerSession({
        visitorToken,
        sourcePage: window.location.hash || window.location.pathname,
        language: i18n.language,
      });
      let nextSession = initRes.data;
      const nextVisitorToken =
        normalizeVisitorToken(nextSession?.visitorToken) || visitorToken;
      if (nextVisitorToken) {
        setVisitorToken(nextVisitorToken);
      }

      if (playerToken && nextVisitorToken) {
        try {
          const bindRes = await bindCustomerPlayer({ visitorToken: nextVisitorToken });
          nextSession = bindRes.data || nextSession;
        } catch {
          // keep init session as fallback if bind is rejected or not needed
        }
      }

      setSession(nextSession);
      const conversationId = nextSession.id || nextSession.conversationId;
      const messageRes = await getCustomerMessages(conversationId, nextVisitorToken);
      const list = Array.isArray(messageRes.data) ? messageRes.data : [];
      setMessages(list);
      collapseExistingHistory(nextSession, list);
      setUnread(0);
      setNotice("");
      await markCustomerRead(conversationId, nextVisitorToken);
      connectStream(conversationId, nextVisitorToken);
    } catch (error) {
      handleCustomerServiceError(error.message, "cs.loadFailed");
    } finally {
      ensuringSessionRef.current = false;
      setLoading(false);
    }
  }

  function closeStream() {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }

  function stopPolling() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
  }

  function startPolling(conversationId, currentVisitorToken) {
    if (pollingRef.current) {
      return;
    }
    setPolling(true);
    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await getCustomerMessages(conversationId, currentVisitorToken);
        const list = Array.isArray(res.data) ? res.data : [];
        setMessages((prev) => list.reduce(upsertCustomerMessage, prev));
      } catch (error) {
        if (isCustomerSessionAccessDenied(error?.message)) {
          stopPolling();
          handleCustomerServiceError(error.message, "cs.loadFailed");
          return;
        }
        if (isCustomerSessionClosed(error?.message)) {
          stopPolling();
          setNotice(normalizeCustomerServiceNotice(error.message, t));
        }
      }
    }, 5000);
  }

  async function connectStream(conversationId, currentVisitorToken) {
    closeStream();
    stopPolling();
    try {
      const tokenRes = await createCustomerStreamToken({
        conversationId,
        visitorToken: currentVisitorToken,
      });
      const streamUrl = buildCustomerStreamUrl(
        API_BASE_URL,
        conversationId,
        tokenRes.data.streamToken,
        currentVisitorToken,
      );
      const stream = new EventSource(streamUrl);
      streamRef.current = stream;

      stream.addEventListener("new_message", (event) => {
        try {
          const payload = JSON.parse(event.data);
        setMessages((prev) => upsertCustomerMessage(prev, payload));
        if (!openRef.current && payload.senderType === "admin") {
          setUnread((count) => count + 1);
        }
        if (openRef.current && payload.senderType === "admin") {
          markCustomerRead(conversationId, currentVisitorToken).catch(() => {});
        }
        } catch (error) {
          console.error("Invalid customer service SSE payload", error);
        }
      });

      stream.addEventListener("session_invalidated", (event) => {
        ignoreNextStreamErrorRef.current = true;
        closeStream();
        stopPolling();
        handleCustomerServiceError(event.data || "会话无权访问", "cs.loadFailed");
      });

      stream.addEventListener("session_closed", (event) => {
        ignoreNextStreamErrorRef.current = true;
        closeStream();
        stopPolling();
        setNotice(
          normalizeCustomerServiceNotice(
            event.data || "会话已关闭",
            t,
          ),
        );
      });

      stream.onerror = () => {
        const shouldIgnore = ignoreNextStreamErrorRef.current;
        ignoreNextStreamErrorRef.current = false;
        closeStream();
        if (shouldIgnore) {
          return;
        }
        startPolling(conversationId, currentVisitorToken);
      };
    } catch {
      startPolling(conversationId, currentVisitorToken);
    }
  }

  async function handleTogglePanel() {
    if (suppressToggleRef.current) {
      return;
    }
    if (open) {
      setOpen(false);
      setUnread(0);
      return;
    }
    setOpen(true);
    setUnread(0);
    await ensureSession();
  }

  async function handleSend() {
    const nextContent = input.trim();
    if (!session || !nextContent) {
      return;
    }
    setSending(true);
    try {
      const res = await sendCustomerMessage({
        conversationId: session.id || session.conversationId,
        visitorToken: effectiveVisitorToken,
        content: nextContent,
      });
      setMessages((prev) => upsertCustomerMessage(prev, res.data));
      setInput("");
      setNotice("");
    } catch (error) {
      handleCustomerServiceError(error.message, "cs.sendFailed");
    } finally {
      setSending(false);
    }
  }

  const launcherStyle = {
    left: `${launcherPosition.x}px`,
    top: `${launcherPosition.y}px`,
    width: `${launcherSize}px`,
    height: `${launcherSize}px`,
  };

  const desktopPanelStyle =
    desktopPanelPosition &&
    !isMobile
      ? {
          left: `${desktopPanelPosition.x}px`,
          top: `${desktopPanelPosition.y}px`,
          width: `${DESKTOP_PANEL_WIDTH}px`,
          height: `${desktopPanelHeight}px`,
        }
      : undefined;

  const panelContent = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[#F0FFF7]">{t("cs.title")}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#7BFFCA]/72">
            {polling ? t("cs.polling") : t("cs.connected")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setUnread(0);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#AAB7CB] transition-colors hover:border-[#00FF9A]/30 hover:text-[#EAFBF3]"
          aria-label={t("cs.launch")}
        >
          <MinimizeIcon />
        </button>
      </div>

      <div
        ref={messageBoxRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
      >
        {loading ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#9AA7BD]">
            {t("cs.loading")}
          </div>
        ) : (
          <>
            {hasCollapsedHistory && (
              <button
                type="button"
                onClick={revealHistory}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-[#00FF9A]/18 bg-[#00FF9A]/[0.06] px-4 py-3 text-left text-xs font-medium text-[#7BFFCA]/84 transition-colors hover:border-[#00FF9A]/28 hover:bg-[#00FF9A]/[0.1] hover:text-[#C6FFE6]"
              >
                <span>{t("cs.viewHistory")}</span>
                <HistoryChevronIcon />
              </button>
            )}
            {visibleMessages.length === 0 ? (
              hasCollapsedHistory ? (
                <div className="min-h-[108px] rounded-2xl border border-dashed border-white/8 bg-white/[0.02]" />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-[#9AA7BD]">
                  {t("cs.empty")}
                </div>
              )
            ) : (
              visibleMessages.map((message) => {
                const isMine = message.senderType !== "admin";
                return (
                  <div
                    key={message.id || `${message.senderType}-${message.createTime}`}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_14px_28px_rgba(0,0,0,0.18)] ${
                        isMine
                          ? "border border-[#00FF9A]/22 bg-[#00FF9A]/10 text-[#E9FFF4]"
                          : "border border-white/8 bg-white/[0.05] text-[#E7EDF7]"
                      }`}
                    >
                      <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#8EA0B9]">
                        {isMine ? t("cs.you") : t("cs.support")}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-white/8 px-4 py-4">
        {notice && (
          <div className="mb-3 rounded-2xl border border-amber-400/16 bg-amber-300/[0.06] px-3 py-2 text-xs text-[#FFDFA8]">
            {notice}
          </div>
        )}
        <div className="flex items-stretch gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder={t("cs.placeholder")}
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            className="h-[92px] max-h-[92px] flex-1 resize-none overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-[#E7EDF7] outline-none transition-colors placeholder:text-[#75839A] focus:border-[#00FF9A]/30"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="shrink-0 self-stretch w-[78px] min-w-[78px] rounded-2xl bg-[#00FF9A] px-3 text-sm font-semibold text-[#071017] transition-colors hover:bg-[#00E48A] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {sending ? t("cs.sending") : t("cs.send")}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        ref={launcherRef}
        className="fixed z-40"
        style={launcherStyle}
      >
        <button
          type="button"
          onPointerDown={handleLauncherPointerDown}
          onClick={handleTogglePanel}
          className={`group relative flex h-full w-full touch-none select-none items-center justify-center rounded-full border border-[#00FF9A]/30 bg-[radial-gradient(circle_at_30%_30%,rgba(6,30,23,0.98),rgba(7,10,16,0.96)_70%)] text-[#00FF9A] shadow-[0_0_0_1px_rgba(0,255,154,0.06),0_18px_34px_rgba(0,0,0,0.28),0_0_24px_rgba(0,255,154,0.18)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#00FF9A]/48 hover:text-[#94FFD0] ${
            open ? "border-[#00FF9A]/52 text-[#9DFFD3] shadow-[0_0_0_1px_rgba(0,255,154,0.08),0_24px_36px_rgba(0,0,0,0.3),0_0_32px_rgba(0,255,154,0.22)]" : ""
          } ${dragging ? "scale-[1.04] cursor-grabbing" : "cursor-grab"}`}
          aria-label={t("cs.launch")}
          aria-expanded={open}
        >
          <span className="pointer-events-none absolute inset-[4px] rounded-full border border-white/6" />
          <SupportIcon className={isMobile ? "h-5 w-5" : "h-5.5 w-5.5"} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-[#00FF9A] px-1.5 py-0.5 text-center text-[11px] font-bold text-[#070A0F] shadow-[0_0_14px_rgba(0,255,154,0.28)]">
              {unread}
            </span>
          )}
        </button>
      </div>

      {open && !isMobile && (
        <div
          ref={panelRef}
          className="fixed z-50 flex flex-col overflow-hidden rounded-[30px] border border-[#00FF9A]/14 bg-[linear-gradient(180deg,rgba(7,10,16,0.98),rgba(11,18,32,0.98))] shadow-[0_28px_70px_rgba(0,0,0,0.36),0_0_28px_rgba(0,255,154,0.08)]"
          style={desktopPanelStyle}
        >
          {panelContent}
        </div>
      )}

      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
          onClick={() => {
            setOpen(false);
            setUnread(0);
          }}
        >
          <div
            ref={panelRef}
            className="absolute inset-x-0 bottom-0 flex h-[min(78vh,680px)] flex-col overflow-hidden rounded-t-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,16,0.985),rgba(11,18,32,0.98))] shadow-[0_-20px_48px_rgba(0,0,0,0.32),0_0_24px_rgba(0,255,154,0.08)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pt-3">
              <div className="mx-auto h-1.5 w-14 rounded-full bg-white/10" />
            </div>
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
}
