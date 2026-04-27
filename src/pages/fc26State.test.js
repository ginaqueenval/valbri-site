import test from "node:test";
import assert from "node:assert/strict";

import {
  getPackageQuantity,
  getDesktopOverlayStateClasses,
  updatePackageQuantity,
  resetPackageQuantity,
} from "./fc26State.js";

test("getPackageQuantity returns 1 when card has no stored quantity", () => {
  assert.equal(getPackageQuantity({}, 101), 1);
});

test("updatePackageQuantity clamps quantity into valid range", () => {
  assert.deepEqual(updatePackageQuantity({}, 101, 0), { 101: 1 });
  assert.deepEqual(updatePackageQuantity({}, 101, 99), { 101: 10 });
  assert.deepEqual(updatePackageQuantity({}, 101, 3), { 101: 3 });
});

test("resetPackageQuantity removes stored quantity and falls back to 1", () => {
  const next = resetPackageQuantity({ 101: 3, 202: 2 }, 101);
  assert.deepEqual(next, { 202: 2 });
  assert.equal(getPackageQuantity(next, 101), 1);
});

test("getDesktopOverlayStateClasses keeps pointer-events mutually exclusive", () => {
  assert.equal(
    getDesktopOverlayStateClasses(true),
    "pointer-events-auto z-10 translate-y-0 opacity-100",
  );
  assert.equal(
    getDesktopOverlayStateClasses(false),
    "pointer-events-none translate-y-4 opacity-0",
  );
});
