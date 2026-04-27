import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCustomerStreamUrl,
  isCustomerSessionAccessDenied,
  isCustomerSessionClosed,
  normalizeVisitorToken,
  resolveCustomerVisitorToken,
  upsertCustomerMessage,
} from "./customerServiceState.js";

test("normalizeVisitorToken trims blank-like values into null", () => {
  assert.equal(normalizeVisitorToken(null), null);
  assert.equal(normalizeVisitorToken("   "), null);
  assert.equal(normalizeVisitorToken(" visitor-1 "), "visitor-1");
});

test("upsertCustomerMessage deduplicates by id and keeps chronological order", () => {
  const existing = [
    { id: 2, content: "second" },
    { id: 5, content: "fifth" },
  ];

  assert.deepEqual(upsertCustomerMessage(existing, { id: 5, content: "updated" }), [
    { id: 2, content: "second" },
    { id: 5, content: "updated" },
  ]);

  assert.deepEqual(upsertCustomerMessage(existing, { id: 3, content: "third" }), [
    { id: 2, content: "second" },
    { id: 3, content: "third" },
    { id: 5, content: "fifth" },
  ]);
});

test("buildCustomerStreamUrl appends streamToken and optional visitorToken", () => {
  assert.equal(
    buildCustomerStreamUrl("/api", 101, "token-1", "visitor-1"),
    "/api/cs/stream/player/101?streamToken=token-1&visitorToken=visitor-1",
  );
  assert.equal(
    buildCustomerStreamUrl("/api", 101, "token-1", null),
    "/api/cs/stream/player/101?streamToken=token-1",
  );
});

test("resolveCustomerVisitorToken prefers the live session token over stale local state", () => {
  assert.equal(
    resolveCustomerVisitorToken("visitor-local", { visitorToken: "visitor-session" }),
    "visitor-session",
  );
  assert.equal(
    resolveCustomerVisitorToken("visitor-local", { visitorToken: "   " }),
    "visitor-local",
  );
  assert.equal(resolveCustomerVisitorToken(null, null), null);
});

test("isCustomerSessionAccessDenied matches the backend access denial message", () => {
  assert.equal(isCustomerSessionAccessDenied("会话无权访问"), true);
  assert.equal(isCustomerSessionAccessDenied("  会话无权访问 "), true);
  assert.equal(isCustomerSessionAccessDenied("会话不存在"), false);
});

test("isCustomerSessionClosed matches the backend closed-session message", () => {
  assert.equal(isCustomerSessionClosed("会话已关闭"), true);
  assert.equal(isCustomerSessionClosed("  会话已关闭 "), true);
  assert.equal(isCustomerSessionClosed("会话无权访问"), false);
});
