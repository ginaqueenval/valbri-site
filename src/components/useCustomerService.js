import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  bindCustomerPlayer,
  createCustomerStreamToken,
  getCustomerMedia,
  getCustomerMessages,
  initCustomerSession,
  markCustomerRead,
  sendCustomerImageMessage,
  sendCustomerMessage,
} from "../api/cs";
import { getStoredPlayerToken as getPlayerToken } from "../utils/playerAuth.js";
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
  clampFloatingPosition,
  getDesktopPanelPosition,
  normalizeFloatingPosition,
} from "../utils/customerServiceFloating.js";
import { encodeToken, decodeToken } from "../utils/storageCodec.js";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
} from "../utils/safeStorage.js";
import {
  VISITOR_TOKEN_KEY,
  DESKTOP_PANEL_WIDTH,
  MAX_MESSAGE_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  CUSTOMER_MESSAGE_WINDOW_DAYS,
  CUSTOMER_HISTORY_SCROLL_THRESHOLD,
  buildCustomerDisplayItems,
  getViewportSnapshot,
  getLauncherConfig,
  getInitialLauncherPosition,
  mergeCustomerMessages,
  normalizeMessageWindowPayload,
} from "../utils/customerServiceHelpers.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// "智能贴边 · 单击直达" — 首次访问时按钮全显 3s 引导新用户,之后 localStorage
// 记忆已展示,直接进入半藏态。CSS :hover 自动处理桌面收回(1.5s 延迟),JS 仅在
// 拖拽/聊天打开/首次引导三种情况下通过 cs-launcher-active 类强制全显。
const CS_WELCOME_STORAGE_KEY = "cs_welcome_shown";
const PEEK_WELCOME_DURATION_MS = 3000;

export default function useCustomerService() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mediaUrls, setMediaUrls] = useState({});
  const [input, setInput] = useState("");
  const [session, setSession] = useState(null);
  const [visitorToken, setVisitorToken] = useState(() =>
    // 防御:hook init 阶段,storage 抛错会让客服 hook 挂载失败 → 整页降级
    normalizeVisitorToken(decodeToken(safeGetItem(VISITOR_TOKEN_KEY))),
  );
  const [unread, setUnread] = useState(0);
  const [notice, setNotice] = useState("");
  const [polling, setPolling] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [viewport, setViewport] = useState(() => getViewportSnapshot());
  const [launcherPosition, setLauncherPosition] = useState(() =>
    getInitialLauncherPosition(),
  );
  const [dragging, setDragging] = useState(false);
  const [historyBefore, setHistoryBefore] = useState(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [welcomeActive, setWelcomeActive] = useState(false);

  const streamRef = useRef(null);
  const pollingRef = useRef(null);
  const messageBoxRef = useRef(null);
  const previousMessageScrollHeightRef = useRef(null);
  const mediaUrlsRef = useRef({});
  const launcherRef = useRef(null);
  const panelRef = useRef(null);
  const imageInputRef = useRef(null);
  const dragStateRef = useRef(null);
  const launcherPositionRef = useRef(launcherPosition);
  const viewportRef = useRef(viewport);
  const suppressToggleRef = useRef(false);
  const ignoreNextLauncherClickRef = useRef(false);
  const launcherClickIgnoreTimerRef = useRef(null);
  const togglePanelRef = useRef(null);
  const openRef = useRef(open);
  const ignoreNextStreamErrorRef = useRef(false);
  const sseRetryCountRef = useRef(0);
  const sseRetryTimerRef = useRef(null);
  const ensuringSessionRef = useRef(false);
  const loadingHistoryRef = useRef(false);
  const preserveHistoryScrollRef = useRef(false);

  const playerToken = getPlayerToken();
  const effectiveVisitorToken = resolveCustomerVisitorToken(visitorToken, session);
  const displayItems = buildCustomerDisplayItems(messages, i18n.language);
  const launcherConfig = getLauncherConfig(viewport.width);
  const launcherSize = launcherConfig.buttonSize;

  // 贴边方向:按钮中心点偏向视口哪一边,半藏就贴哪边
  const peekEdge =
    launcherPosition.x + launcherSize / 2 < viewport.width / 2
      ? "left"
      : "right";
  // 强制全显的三种情况:拖拽中 / 聊天打开 / 首次访问引导
  const peekActive = dragging || open || welcomeActive;
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
    // 拖动中只夹回视口,允许自由水平/垂直移动
    const nextPosition = clampFloatingPosition(
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
      // 松手时吸附到最近的左/右边缘
      const releaseViewport = viewportRef.current;
      const snapped = normalizeFloatingPosition(
        launcherPositionRef.current,
        releaseViewport,
        getLauncherConfig(releaseViewport.width),
      );
      setLauncherPosition(snapped);
      suppressToggleRef.current = true;
      ignoreNextLauncherClickRef.current = true;
      window.setTimeout(() => {
        suppressToggleRef.current = false;
      }, 0);
      if (launcherClickIgnoreTimerRef.current) {
        window.clearTimeout(launcherClickIgnoreTimerRef.current);
      }
      launcherClickIgnoreTimerRef.current = window.setTimeout(() => {
        ignoreNextLauncherClickRef.current = false;
        launcherClickIgnoreTimerRef.current = null;
      }, 350);
    }
    if (!dragState.moved) {
      ignoreNextLauncherClickRef.current = true;
      if (launcherClickIgnoreTimerRef.current) {
        window.clearTimeout(launcherClickIgnoreTimerRef.current);
      }
      launcherClickIgnoreTimerRef.current = window.setTimeout(() => {
        ignoreNextLauncherClickRef.current = false;
        launcherClickIgnoreTimerRef.current = null;
      }, 350);
      togglePanelRef.current?.();
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
    if (!open && showAttachmentMenu) {
      setShowAttachmentMenu(false);
    }
  }, [open, showAttachmentMenu]);

  useEffect(() => {
    mediaUrlsRef.current = mediaUrls;
  }, [mediaUrls]);

  useEffect(() => {
    if (visitorToken) {
      safeSetItem(VISITOR_TOKEN_KEY, encodeToken(visitorToken));
      return;
    }
    safeRemoveItem(VISITOR_TOKEN_KEY);
  }, [visitorToken]);

  useEffect(() => {
    safeSetItem(
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

  function scrollMessageBoxToBottom(behavior = "auto") {
    const stage = messageBoxRef.current;
    if (!stage) {
      return;
    }
    stage.scrollTo({
      top: stage.scrollHeight,
      behavior,
    });
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    if (previousMessageScrollHeightRef.current != null) {
      const previousHeight = previousMessageScrollHeightRef.current;
      previousMessageScrollHeightRef.current = null;
      const stage = messageBoxRef.current;
      if (stage) {
        preserveHistoryScrollRef.current = true;
        window.setTimeout(() => {
          stage.scrollTop = stage.scrollHeight - previousHeight + stage.scrollTop;
          window.setTimeout(() => {
            preserveHistoryScrollRef.current = false;
          }, 0);
        }, 0);
      }
      return undefined;
    }
    const timer = window.setTimeout(() => {
      scrollMessageBoxToBottom("auto");
      window.requestAnimationFrame(() => scrollMessageBoxToBottom("auto"));
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
      if (sseRetryTimerRef.current) {
        window.clearTimeout(sseRetryTimerRef.current);
        sseRetryTimerRef.current = null;
      }
      if (launcherClickIgnoreTimerRef.current) {
        window.clearTimeout(launcherClickIgnoreTimerRef.current);
        launcherClickIgnoreTimerRef.current = null;
      }
      Object.values(mediaUrlsRef.current).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
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
    const imageIds = new Set(
      messages
        .filter((message) => message.contentType === "image" && message.id)
        .map((message) => String(message.id)),
    );
    const staleEntries = Object.entries(mediaUrlsRef.current).filter(
      ([messageId]) => !imageIds.has(messageId),
    );
    if (staleEntries.length) {
      staleEntries.forEach(([, url]) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      setMediaUrls((current) => {
        const next = { ...current };
        staleEntries.forEach(([messageId]) => delete next[messageId]);
        return next;
      });
    }
    messages
      .filter((message) => message.contentType === "image" && message.id && !mediaUrlsRef.current[message.id])
      .forEach(async (message) => {
        try {
          const blob = await getCustomerMedia(message.id, effectiveVisitorToken);
          const objectUrl = URL.createObjectURL(blob);
          setMediaUrls((current) => ({ ...current, [message.id]: objectUrl }));
        } catch {
          setMediaUrls((current) => ({ ...current, [message.id]: "" }));
        }
      });
  }, [effectiveVisitorToken, messages]);

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
    setHistoryBefore(null);
    setHasMoreHistory(false);
    setLoadingHistory(false);
    setVisitorToken(null);
    setInput("");
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

  function applyMessageWindow(payload, mode = "replace") {
    const windowPayload = normalizeMessageWindowPayload(payload);
    setHistoryBefore(windowPayload.nextBefore);
    setHasMoreHistory(windowPayload.hasMore);
    setMessages((current) =>
      mode === "prepend"
        ? mergeCustomerMessages(windowPayload.rows, current)
        : mergeCustomerMessages([], windowPayload.rows),
    );
    return windowPayload;
  }

  async function loadInitialMessages(conversationId, currentVisitorToken) {
    const messageRes = await getCustomerMessages(conversationId, currentVisitorToken, {
      days: CUSTOMER_MESSAGE_WINDOW_DAYS,
    });
    return applyMessageWindow(messageRes.data, "replace");
  }

  async function loadOlderMessages() {
    if (!session || !hasMoreHistory || !historyBefore || loadingHistoryRef.current) {
      return;
    }
    const stage = messageBoxRef.current;
    previousMessageScrollHeightRef.current = stage ? stage.scrollHeight : null;
    loadingHistoryRef.current = true;
    setLoadingHistory(true);
    try {
      const conversationId = session.id || session.conversationId;
      const messageRes = await getCustomerMessages(conversationId, effectiveVisitorToken, {
        before: historyBefore,
        days: CUSTOMER_MESSAGE_WINDOW_DAYS,
      });
      applyMessageWindow(messageRes.data, "prepend");
      setNotice("");
    } catch (error) {
      previousMessageScrollHeightRef.current = null;
      handleCustomerServiceError(error.message, "cs.loadFailed");
    } finally {
      loadingHistoryRef.current = false;
      setLoadingHistory(false);
    }
  }

  function handleMessageBoxScroll() {
    if (messageBoxRef.current && messageBoxRef.current.scrollTop <= CUSTOMER_HISTORY_SCROLL_THRESHOLD) {
      loadOlderMessages();
    }
  }

  function handleMessageImageLoad() {
    if (!openRef.current || preserveHistoryScrollRef.current) {
      return;
    }
    window.requestAnimationFrame(() => scrollMessageBoxToBottom("auto"));
  }

  function closeStream() {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    if (sseRetryTimerRef.current) {
      window.clearTimeout(sseRetryTimerRef.current);
      sseRetryTimerRef.current = null;
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
        const res = await getCustomerMessages(conversationId, currentVisitorToken, {
          days: CUSTOMER_MESSAGE_WINDOW_DAYS,
        });
        const list = normalizeMessageWindowPayload(res.data).rows;
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
      sseRetryCountRef.current = 0;

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
        handleCustomerServiceError(event.data || t("cs.sessionAccessDenied"), "cs.loadFailed");
      });

      stream.addEventListener("session_closed", (event) => {
        ignoreNextStreamErrorRef.current = true;
        closeStream();
        stopPolling();
        setNotice(
          normalizeCustomerServiceNotice(
            event.data || t("cs.sessionClosed"),
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
        const retries = sseRetryCountRef.current;
        const MAX_SSE_RETRIES = 3;
        if (retries < MAX_SSE_RETRIES) {
          sseRetryCountRef.current = retries + 1;
          const delayMs = 1000 * Math.pow(2, retries);
          sseRetryTimerRef.current = window.setTimeout(() => {
            sseRetryTimerRef.current = null;
            connectStream(conversationId, currentVisitorToken);
          }, delayMs);
        } else {
          sseRetryCountRef.current = 0;
          startPolling(conversationId, currentVisitorToken);
        }
      };
    } catch {
      const retries = sseRetryCountRef.current;
      const MAX_SSE_RETRIES = 3;
      if (retries < MAX_SSE_RETRIES) {
        sseRetryCountRef.current = retries + 1;
        const delayMs = 1000 * Math.pow(2, retries);
        sseRetryTimerRef.current = window.setTimeout(() => {
          sseRetryTimerRef.current = null;
          connectStream(conversationId, currentVisitorToken);
        }, delayMs);
      } else {
        sseRetryCountRef.current = 0;
        startPolling(conversationId, currentVisitorToken);
      }
    }
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
      await loadInitialMessages(conversationId, nextVisitorToken);
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

  togglePanelRef.current = handleTogglePanel;

  function handleLauncherClick() {
    if (ignoreNextLauncherClickRef.current) {
      ignoreNextLauncherClickRef.current = false;
      if (launcherClickIgnoreTimerRef.current) {
        window.clearTimeout(launcherClickIgnoreTimerRef.current);
        launcherClickIgnoreTimerRef.current = null;
      }
      return;
    }
    handleTogglePanel();
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

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!session || !file) {
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice(t("cs.imageTypeInvalid"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setNotice(t("cs.imageTooLarge"));
      return;
    }
    const formData = new FormData();
    formData.append("conversationId", session.id || session.conversationId);
    const nextVisitorToken = effectiveVisitorToken;
    if (nextVisitorToken) {
      formData.append("visitorToken", nextVisitorToken);
    }
    formData.append("file", file);
    setUploadingImage(true);
    try {
      const res = await sendCustomerImageMessage(formData);
      setMessages((prev) => upsertCustomerMessage(prev, res.data));
      setNotice("");
    } catch (error) {
      handleCustomerServiceError(error.message, "cs.sendFailed");
    } finally {
      setUploadingImage(false);
    }
  }

  // 首次访问 3s 全显引导,之后 localStorage 记忆,直接半藏
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    // 走 safeStorage:storage 不可用时视作"已展示过",避免重复打扰用户
    const alreadyShown = !!safeGetItem(CS_WELCOME_STORAGE_KEY);
    if (alreadyShown) return undefined;
    setWelcomeActive(true);
    const timer = window.setTimeout(() => {
      setWelcomeActive(false);
      safeSetItem(CS_WELCOME_STORAGE_KEY, "1");
    }, PEEK_WELCOME_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return {
    t,
    open,
    setOpen,
    loading,
    sending,
    uploadingImage,
    messages,
    mediaUrls,
    input,
    setInput,
    session,
    unread,
    setUnread,
    notice,
    polling,
    showAttachmentMenu,
    setShowAttachmentMenu,
    launcherPosition,
    dragging,
    peekEdge,
    peekActive,
    hasMoreHistory,
    loadingHistory,
    displayItems,
    launcherSize,
    isMobile,
    desktopPanelHeight,
    desktopPanelPosition,
    effectiveVisitorToken,
    messageBoxRef,
    launcherRef,
    panelRef,
    imageInputRef,
    handleLauncherPointerDown,
    handleLauncherClick,
    handleMessageBoxScroll,
    handleMessageImageLoad,
    handleSend,
    handleImageChange,
    loadOlderMessages,
    API_BASE_URL,
    MAX_MESSAGE_LENGTH,
    DESKTOP_PANEL_WIDTH,
  };
}
