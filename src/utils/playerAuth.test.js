import test from "node:test";
import assert from "node:assert/strict";

import {
  PLAYER_AUTH_CHANGED_EVENT,
  PLAYER_SESSION_EXPIRED_EVENT,
  clearStoredPlayerSession,
  getStoredPlayerSession,
  shouldClearPlayerSessionOnBootstrapError,
  setStoredPlayerSession,
} from "./playerAuth.js";

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

function createEventTarget() {
  const events = [];
  return {
    events,
    dispatchEvent(event) {
      events.push({ type: event.type, detail: event.detail });
      return true;
    },
  };
}

test("setStoredPlayerSession persists token/player and dispatches auth change", () => {
  const storage = createStorage();
  const eventTarget = createEventTarget();

  setStoredPlayerSession(
    {
      token: "token-1",
      player: { id: 7, username: "tester" },
    },
    { storage, eventTarget, reason: "login" },
  );

  assert.deepEqual(getStoredPlayerSession(storage), {
    token: "token-1",
    player: { id: 7, username: "tester" },
  });
  assert.deepEqual(eventTarget.events, [
    {
      type: PLAYER_AUTH_CHANGED_EVENT,
      detail: { isLoggedIn: true, reason: "login" },
    },
  ]);
});

test("clearStoredPlayerSession clears storage silently without expired prompt by default", () => {
  const storage = createStorage({
    player_token: "token-1",
    player_info: JSON.stringify({ id: 9, username: "expired-user" }),
  });
  const eventTarget = createEventTarget();

  clearStoredPlayerSession({ storage, eventTarget, reason: "bootstrap" });

  assert.deepEqual(getStoredPlayerSession(storage), {
    token: null,
    player: null,
  });
  assert.deepEqual(eventTarget.events, [
    {
      type: PLAYER_AUTH_CHANGED_EVENT,
      detail: { isLoggedIn: false, reason: "bootstrap" },
    },
  ]);
});

test("clearStoredPlayerSession can emit session expired prompt for interactive 401 flows", () => {
  const storage = createStorage({
    player_token: "token-1",
    player_info: JSON.stringify({ id: 9, username: "expired-user" }),
  });
  const eventTarget = createEventTarget();

  clearStoredPlayerSession({
    storage,
    eventTarget,
    reason: "expired",
    notifySessionExpired: true,
  });

  assert.deepEqual(eventTarget.events, [
    {
      type: PLAYER_AUTH_CHANGED_EVENT,
      detail: { isLoggedIn: false, reason: "expired" },
    },
    {
      type: PLAYER_SESSION_EXPIRED_EVENT,
      detail: { reason: "expired" },
    },
  ]);
});

test("shouldClearPlayerSessionOnBootstrapError only clears for unauthorized errors", () => {
  assert.equal(
    shouldClearPlayerSessionOnBootstrapError({ response: { status: 401 } }),
    true,
  );
  assert.equal(
    shouldClearPlayerSessionOnBootstrapError({ response: { status: 500 } }),
    false,
  );
  assert.equal(
    shouldClearPlayerSessionOnBootstrapError(new Error("network down")),
    false,
  );
});
