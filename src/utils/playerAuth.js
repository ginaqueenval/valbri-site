export const PLAYER_TOKEN_KEY = "player_token";
export const PLAYER_INFO_KEY = "player_info";
export const PLAYER_AUTH_CHANGED_EVENT = "player-auth-changed";
export const PLAYER_SESSION_EXPIRED_EVENT = "player-session-expired";

function getStorage(storage = globalThis.localStorage) {
  return storage ?? null;
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
  return getStorage(storage)?.getItem(PLAYER_TOKEN_KEY) || null;
}

export function getStoredPlayerInfo(storage) {
  return parsePlayer(getStorage(storage)?.getItem(PLAYER_INFO_KEY));
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

export function setStoredPlayerSession(
  { token, player },
  { storage, eventTarget, reason = "login" } = {},
) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return;
  }
  targetStorage.setItem(PLAYER_TOKEN_KEY, token);
  targetStorage.setItem(PLAYER_INFO_KEY, JSON.stringify(player || null));
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
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return;
  }
  targetStorage.removeItem(PLAYER_TOKEN_KEY);
  targetStorage.removeItem(PLAYER_INFO_KEY);
  dispatchEvent(
    PLAYER_AUTH_CHANGED_EVENT,
    { isLoggedIn: false, reason },
    eventTarget,
  );
  if (notifySessionExpired) {
    dispatchEvent(
      PLAYER_SESSION_EXPIRED_EVENT,
      { reason },
      eventTarget,
    );
  }
}
