import test from "node:test";
import assert from "node:assert/strict";

import {
  getDefaultFloatingPosition,
  getDesktopPanelPosition,
  normalizeFloatingPosition,
} from "./customerServiceFloating.js";

test("getDefaultFloatingPosition anchors the launcher to the lower right corner", () => {
  assert.deepEqual(
    getDefaultFloatingPosition(
      { width: 1440, height: 900 },
      { buttonSize: 60, padding: 18 },
    ),
    { x: 1362, y: 822 },
  );
});

test("normalizeFloatingPosition clamps desktop launcher position inside viewport", () => {
  assert.deepEqual(
    normalizeFloatingPosition(
      { x: 1500, y: -40 },
      { width: 1280, height: 720 },
      { buttonSize: 60, padding: 18, mobile: false },
    ),
    { x: 1202, y: 18 },
  );
});

test("normalizeFloatingPosition snaps mobile launcher to the closest screen edge", () => {
  assert.deepEqual(
    normalizeFloatingPosition(
      { x: 180, y: 760 },
      { width: 390, height: 844 },
      { buttonSize: 58, padding: 14, mobile: true },
    ),
    { x: 180, y: 772 },
  );

  assert.deepEqual(
    normalizeFloatingPosition(
      { x: 20, y: 260 },
      { width: 390, height: 844 },
      { buttonSize: 58, padding: 14, mobile: true },
    ),
    { x: 14, y: 260 },
  );
});

test("getDesktopPanelPosition flips the panel to the left when the launcher is near the right edge", () => {
  assert.deepEqual(
    getDesktopPanelPosition(
      { x: 1180, y: 620 },
      { width: 1280, height: 900 },
      {
        buttonSize: 60,
        panelWidth: 400,
        panelHeight: 620,
        padding: 18,
        gap: 14,
      },
    ),
    { x: 766, y: 60, side: "left" },
  );
});
