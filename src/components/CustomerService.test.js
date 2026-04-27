import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./CustomerService.jsx", import.meta.url),
  "utf8",
);

test("drag callbacks are declared before effects that depend on them", () => {
  const effectIndex = source.indexOf("useEffect(() => {\n    return () => {");
  const moveIndex = source.indexOf("const handlePointerMove = useCallback");
  const upIndex = source.indexOf("const handlePointerUp = useCallback");

  assert.notEqual(effectIndex, -1, "cleanup effect should exist");
  assert.notEqual(moveIndex, -1, "handlePointerMove should exist");
  assert.notEqual(upIndex, -1, "handlePointerUp should exist");
  assert.ok(moveIndex < effectIndex, "handlePointerMove must be declared before cleanup effect");
  assert.ok(upIndex < effectIndex, "handlePointerUp must be declared before cleanup effect");
});

test("customer service protects SSE payload parsing with try catch", () => {
  const guardedParseIndex = source.indexOf("try {\n          const payload = JSON.parse(event.data);");
  assert.notEqual(guardedParseIndex, -1, "SSE payload parsing should be wrapped in try/catch");
});

test("customer service guards ensureSession from concurrent re-entry", () => {
  assert.notEqual(
    source.indexOf("const ensuringSessionRef = useRef(false);"),
    -1,
    "ensureSession should use a re-entry lock",
  );
  assert.notEqual(
    source.indexOf("if (ensuringSessionRef.current) {\n      return;\n    }"),
    -1,
    "ensureSession should exit early when already running",
  );
});

test("customer service launcher disables native touch gestures while dragging", () => {
  assert.notEqual(
    source.indexOf('if (event.pointerType === "touch") {\n      event.preventDefault();\n    }'),
    -1,
    "touch drags should prevent the browser from hijacking the gesture",
  );
  assert.notEqual(
    source.indexOf('touch-none select-none'),
    -1,
    "launcher should opt out of touch scrolling and text selection",
  );
});

test("customer service message box prevents background scroll via overscroll-behavior", () => {
  assert.notEqual(
    source.indexOf('overscrollBehavior'),
    -1,
    "message box should declare overscrollBehavior to contain scroll propagation",
  );
  assert.notEqual(
    source.indexOf('WebkitOverflowScrolling'),
    -1,
    "message box should enable WebKit momentum scrolling on mobile",
  );
});

test("customer service composer limits message length and keeps a fixed height", () => {
  assert.notEqual(
    source.indexOf("const MAX_MESSAGE_LENGTH = 500;"),
    -1,
    "composer should define a 500 character ceiling",
  );
  assert.notEqual(
    source.indexOf("maxLength={MAX_MESSAGE_LENGTH}"),
    -1,
    "textarea should expose the maxLength guard to the browser",
  );
  assert.notEqual(
    source.indexOf("slice(0, MAX_MESSAGE_LENGTH)"),
    -1,
    "composer should clamp pasted content to 500 characters",
  );
  assert.notEqual(
    source.indexOf("h-[92px] max-h-[92px]"),
    -1,
    "textarea should keep a fixed height even while sending",
  );
});

test("customer service wraps long message content and stretches the send button to match", () => {
  assert.notEqual(
    source.indexOf("whitespace-pre-wrap break-words"),
    -1,
    "message bubbles should wrap long content instead of overflowing",
  );
  assert.notEqual(
    source.indexOf("flex items-stretch gap-3"),
    -1,
    "composer row should stretch children to the same height",
  );
  assert.notEqual(
    source.indexOf("shrink-0 self-stretch"),
    -1,
    "send button should stretch to the full composer height",
  );
  assert.notEqual(
    source.indexOf('w-[78px] min-w-[78px]'),
    -1,
    "send button should keep a stable width while sending",
  );
  assert.notEqual(
    source.indexOf('t("cs.sending")'),
    -1,
    "send button should use localized sending text instead of ellipsis",
  );
});

test("guest customer service history stays collapsed until the visitor explicitly requests it", () => {
  assert.notEqual(
    source.indexOf("const [historyCutoffId, setHistoryCutoffId] = useState(null);"),
    -1,
    "customer service should track a collapsible history cutoff marker",
  );
  assert.notEqual(
    source.indexOf("nextSession?.sourceType === \"guest\" && list.length > 0"),
    -1,
    "guest sessions with existing messages should start in a collapsed-history state",
  );
  assert.notEqual(
    source.indexOf("messages.filter((message) => Number(message?.id || 0) > historyCutoffId)"),
    -1,
    "collapsed guest history should hide messages that existed before reopening the panel",
  );
  assert.notEqual(
    source.indexOf('t("cs.viewHistory")'),
    -1,
    "guest sessions with hidden history should render an explicit view-history affordance",
  );
});

test("logged-in players collapse history only on the first post-login open and remember when history was revealed", () => {
  assert.notEqual(
    source.indexOf("const PLAYER_HISTORY_REVEALED_PREFIX = \"cs_player_history_revealed:\";"),
    -1,
    "customer service should define a storage key for revealed player history",
  );
  assert.notEqual(
    source.indexOf("shouldCollapsePlayerHistory(playerToken)"),
    -1,
    "customer service should explicitly decide whether player history should start collapsed",
  );
  assert.notEqual(
    source.indexOf("markPlayerHistoryRevealed(playerToken);"),
    -1,
    "customer service should persist that a player has already expanded history",
  );
  assert.notEqual(
    source.indexOf("nextSession?.sourceType === \"player\" && list.length > 0 && shouldCollapsePlayerHistory(playerToken)"),
    -1,
    "existing player history should only collapse on the first open after login",
  );
});

test("collapsed history affordance is rendered as a subtle system notice instead of plain text", () => {
  assert.notEqual(
    source.indexOf('inline-flex w-full items-center justify-between rounded-2xl border border-[#00FF9A]/18 bg-[#00FF9A]/[0.06]'),
    -1,
    "view-history affordance should use a full-width notice-bar treatment",
  );
  assert.notEqual(
    source.indexOf('h-4 w-4 text-[#9EFED1]'),
    -1,
    "view-history affordance should include a compact directional icon",
  );
});
