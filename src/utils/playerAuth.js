import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
} from "./safeStorage.js";

export const PLAYER_TOKEN_KEY = "player_token";
export const PLAYER_INFO_KEY = "player_info";
export const PLAYER_AUTH_CHANGED_EVENT = "player-auth-changed";
export const PLAYER_SESSION_EXPIRED_EVENT = "player-session-expired";

/**
 * Storage 策略(Remember me 抉择)
 * - remember === true  → localStorage(关浏览器仍在)
 * - remember === false → sessionStorage(关浏览器即失效)
 * - remember === undefined(bootstrap / 续签等无意图场景)
 *     沿用已有 token 所在 storage,避免无意中把"记住我"降级为本会话。
 *
 * 读侧:优先 localStorage(持久化),回落 sessionStorage(本会话)。
 * 清侧:同时清两边,避免遗留产生鬼影 token。
 *
 * 所有 storage 操作均经 safeStorage 防御:Safari 隐私模式 / 严格 ITP /
 * Quota 满 / iframe 沙箱 / SSR 等场景下静默失败,不向调用方抛出。
 *
 * 测试路径(通过 opts.storage 显式注入)仍按单 storage 旧契约工作。
 */

function getStorage(storage) {
  if (storage !== undefined) {
    return storage ?? null;
  }
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function tryGetGlobalStorage(name) {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null;
  }
}

function getReadStorages() {
  const out = [];
  const local = tryGetGlobalStorage("localStorage");
  if (local) out.push(local);
  const session = tryGetGlobalStorage("sessionStorage");
  if (session) out.push(session);
  return out;
}

function readFirstAvailable(key) {
  for (const s of getReadStorages()) {
    const v = safeGetItem(key, null, s);
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function getEventTarget(eventTarget = globalThis.window) {
  return eventTarget ?? null;
}

function createEvent(type, detail) {
  if (typeof CustomEvent === "function") {
    return new CustomEvent(type, { detail });
  }
  if (typeof Event === "function") {
    const event = new Event(type);
    event.detail = detail;
    return event;
  }
  return { type, detail };
}

function dispatchEvent(type, detail, eventTarget) {
  const target = getEventTarget(eventTarget);
  if (!target?.dispatchEvent) {
    return;
  }
  target.dispatchEvent(createEvent(type, detail));
}

function parsePlayer(rawValue) {
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export function getStoredPlayerToken(storage) {
  if (storage !== undefined) {
    return safeGetItem(PLAYER_TOKEN_KEY, null, getStorage(storage)) || null;
  }
  return readFirstAvailable(PLAYER_TOKEN_KEY) || null;
}

export function getStoredPlayerInfo(storage) {
  if (storage !== undefined) {
    return parsePlayer(
      safeGetItem(PLAYER_INFO_KEY, null, getStorage(storage)),
    );
  }
  return parsePlayer(readFirstAvailable(PLAYER_INFO_KEY));
}

export function getStoredPlayerSession(storage) {
  return {
    token: getStoredPlayerToken(storage),
    player: getStoredPlayerInfo(storage),
  };
}

export function shouldClearPlayerSessionOnBootstrapError(error) {
  return error?.response?.status === 401;
}

function pickPersistAndGhostStorage(remember) {
  const local = tryGetGlobalStorage("localStorage");
  const session = tryGetGlobalStorage("sessionStorage");
  if (remember === true) {
    return { persistStorage: local, ghostStorage: session };
  }
  if (remember === false) {
    return { persistStorage: session, ghostStorage: local };
  }
  // remember === undefined:守住现有 storage,避免 bootstrap/续签把 remember 降级
  if (local && safeGetItem(PLAYER_TOKEN_KEY, null, local)) {
    return { persistStorage: local, ghostStorage: session };
  }
  if (session && safeGetItem(PLAYER_TOKEN_KEY, null, session)) {
    return { persistStorage: session, ghostStorage: local };
  }
  // 都没有(新登录漏传 remember 等),保守落到 sessionStorage
  return { persistStorage: session, ghostStorage: local };
}

export function setStoredPlayerSession(
  { token, player },
  { storage, eventTarget, reason = "login", remember } = {},
) {
  // 显式 storage 走单 storage 旧契约(主要供测试 / 老调用兜底)
  if (storage !== undefined) {
    const targetStorage = getStorage(storage);
    if (!targetStorage) return;
    safeSetItem(PLAYER_TOKEN_KEY, token, targetStorage);
    safeSetItem(PLAYER_INFO_KEY, JSON.stringify(player || null), targetStorage);
    dispatchEvent(
      PLAYER_AUTH_CHANGED_EVENT,
      { isLoggedIn: true, reason },
      eventTarget,
    );
    return;
  }

  const { persistStorage, ghostStorage } = pickPersistAndGhostStorage(remember);
  if (!persistStorage) return;
  safeSetItem(PLAYER_TOKEN_KEY, token, persistStorage);
  safeSetItem(PLAYER_INFO_KEY, JSON.stringify(player || null), persistStorage);
  // 清掉对侧 storage,避免双写遗留导致 read 取到旧值
  if (ghostStorage) {
    safeRemoveItem(PLAYER_TOKEN_KEY, ghostStorage);
    safeRemoveItem(PLAYER_INFO_KEY, ghostStorage);
  }
  dispatchEvent(
    PLAYER_AUTH_CHANGED_EVENT,
    { isLoggedIn: true, reason },
    eventTarget,
  );
}

export function clearStoredPlayerSession({
  storage,
  eventTarget,
  reason = "logout",
  notifySessionExpired = false,
} = {}) {
  // 显式 storage 维持单 storage 旧契约
  if (storage !== undefined) {
    const targetStorage = getStorage(storage);
    if (!targetStorage) return;
    safeRemoveItem(PLAYER_TOKEN_KEY, targetStorage);
    safeRemoveItem(PLAYER_INFO_KEY, targetStorage);
    dispatchEvent(
      PLAYER_AUTH_CHANGED_EVENT,
      { isLoggedIn: false, reason },
      eventTarget,
    );
    if (notifySessionExpired) {
      dispatchEvent(PLAYER_SESSION_EXPIRED_EVENT, { reason }, eventTarget);
    }
    return;
  }

  // 默认路径:双 storage 全清,避免一边残留鬼影
  const local = tryGetGlobalStorage("localStorage");
  if (local) {
    safeRemoveItem(PLAYER_TOKEN_KEY, local);
    safeRemoveItem(PLAYER_INFO_KEY, local);
  }
  const session = tryGetGlobalStorage("sessionStorage");
  if (session) {
    safeRemoveItem(PLAYER_TOKEN_KEY, session);
    safeRemoveItem(PLAYER_INFO_KEY, session);
  }
  dispatchEvent(
    PLAYER_AUTH_CHANGED_EVENT,
    { isLoggedIn: false, reason },
    eventTarget,
  );
  if (notifySessionExpired) {
    dispatchEvent(PLAYER_SESSION_EXPIRED_EVENT, { reason }, eventTarget);
  }
}
