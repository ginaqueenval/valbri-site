import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./CustomerService.jsx", import.meta.url),
  "utf8",
);
const globalStyles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const enLocale = readFileSync(new URL("../i18n/locales/en.json", import.meta.url), "utf8");
const zhLocale = readFileSync(new URL("../i18n/locales/zh.json", import.meta.url), "utf8");

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

test("customer service launcher opens from pointerup after a tap because touch preventDefault can cancel click", () => {
  assert.notEqual(
    source.indexOf("const ignoreNextLauncherClickRef = useRef(false);"),
    -1,
    "launcher should track the synthetic click after pointer activation",
  );
  assert.notEqual(
    source.indexOf("if (!dragState.moved) {"),
    -1,
    "pointerup should distinguish tap releases from drag releases",
  );
  assert.notEqual(
    source.indexOf("togglePanelRef.current?.();"),
    -1,
    "a non-drag pointer release should open the panel without waiting for click",
  );
  assert.notEqual(
    source.indexOf("function handleLauncherClick() {"),
    -1,
    "launcher click should be routed through a duplicate-click guard",
  );
  assert.notEqual(
    source.indexOf("ignoreNextLauncherClickRef.current = false;"),
    -1,
    "the following synthetic click should be ignored to avoid double toggling",
  );
  assert.notEqual(
    source.indexOf("onClick={handleLauncherClick}"),
    -1,
    "launcher button should use the duplicate-click guard",
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
    source.indexOf("h-[54px] max-h-[54px]"),
    -1,
    "textarea should keep a compact fixed height even while sending",
  );
});

test("customer service wraps long message content and keeps stable composer actions", () => {
  assert.notEqual(
    source.indexOf("whitespace-pre-wrap break-words"),
    -1,
    "message bubbles should wrap long content instead of overflowing",
  );
  assert.notEqual(
    source.indexOf("flex items-center gap-2.5"),
    -1,
    "composer row should keep a compact single-line chat input layout",
  );
  assert.notEqual(
    source.indexOf('flex shrink-0 items-center gap-2'),
    -1,
    "composer actions should keep compact intrinsic width beside the input",
  );
  assert.notEqual(
    source.indexOf('h-[54px]'),
    -1,
    "send button should match the compact single-line composer height",
  );
  assert.notEqual(
    source.indexOf('t("cs.sending")'),
    -1,
    "send button should use localized sending text instead of ellipsis",
  );
});

test("customer service renders compact chat bubbles instead of tall cards", () => {
  assert.notEqual(
    source.indexOf("flex max-w-[76%] flex-col"),
    -1,
    "message rows should constrain content without turning short messages into tall cards",
  );
  assert.notEqual(
    source.indexOf("rounded-[10px] px-3.5 py-2 text-sm leading-5"),
    -1,
    "message bubbles should use compact padding and only slightly rounded corners",
  );
  assert.equal(
    source.indexOf("rounded-[18px] px-3.5 py-2 text-sm leading-5"),
    -1,
    "message bubbles should not keep the previous overly round corner radius",
  );
  assert.equal(
    source.indexOf("rounded-2xl px-4 py-3 text-sm leading-6"),
    -1,
    "message bubbles should not use the old bulky card treatment",
  );
  assert.notEqual(
    source.indexOf('mb-1 px-1 text-[10px] font-semibold text-[#8EA0B9]'),
    -1,
    "sender labels should sit outside the bubble so short messages stay slim",
  );
});

test("customer service message area uses a slim dark scrollbar", () => {
  assert.notEqual(
    source.indexOf("customer-service-scrollbar"),
    -1,
    "message box should opt into the custom customer-service scrollbar",
  );
  assert.notEqual(
    globalStyles.indexOf(".customer-service-scrollbar::-webkit-scrollbar"),
    -1,
    "global styles should define the WebKit scrollbar track",
  );
  assert.notEqual(
    globalStyles.indexOf("scrollbar-width: thin;"),
    -1,
    "global styles should use a thin Firefox scrollbar",
  );
});

test("customer service history affordance is rendered as a subtle system notice instead of plain text", () => {
  assert.notEqual(
    source.indexOf('inline-flex w-full items-center justify-between rounded-2xl border border-[#00FF9A]/18 bg-[#00FF9A]/[0.06]'),
    -1,
    "history affordance should use a full-width notice-bar treatment",
  );
  assert.notEqual(
    source.indexOf('h-4 w-4 text-[#9EFED1]'),
    -1,
    "history affordance should include a compact directional icon",
  );
  assert.notEqual(
    source.indexOf("onClick={loadOlderMessages}"),
    -1,
    "history affordance should load one older window instead of revealing all messages",
  );
});

test("customer service can upload image messages and render image bubbles", () => {
  assert.notEqual(
    source.indexOf("sendCustomerImageMessage"),
    -1,
    "customer service should import and call the image message API",
  );
  assert.notEqual(
    source.indexOf('accept="image/jpeg,image/png,image/webp"'),
    -1,
    "customer service file input should restrict selectable image types",
  );
  assert.notEqual(
    source.indexOf('message.contentType === "image"'),
    -1,
    "customer service should branch image messages by contentType",
  );
  assert.notEqual(
    source.indexOf("buildCustomerMediaUrl"),
    -1,
    "customer service should render images through backend media proxy URLs",
  );
  assert.notEqual(
    source.indexOf("getCustomerMedia"),
    -1,
    "customer service should fetch protected media through axios for logged-in players",
  );
  assert.notEqual(
    source.indexOf("URL.createObjectURL"),
    -1,
    "customer service should convert protected media blobs to image URLs",
  );
});

test("customer service uses a compact action rail with a plus menu before opening image picker", () => {
  assert.notEqual(
    source.indexOf("showAttachmentMenu"),
    -1,
    "composer should keep attachment menu state",
  );
  assert.notEqual(
    source.indexOf('aria-label={t("cs.addAttachment")'),
    -1,
    "composer should expose a plus button above send",
  );
  assert.notEqual(
    source.indexOf('onClick={() => setShowAttachmentMenu'),
    -1,
    "plus button should toggle the attachment menu instead of opening the file picker directly",
  );
  assert.notEqual(
    source.indexOf('shrink-0 items-center gap-2'),
    -1,
    "composer actions should keep compact controls beside the input",
  );
  assert.equal(
    source.indexOf('w-[118px] min-w-[118px] shrink-0 items-center gap-2'),
    -1,
    "composer actions should not reserve hidden send-button space while input is empty",
  );
  assert.notEqual(
    source.indexOf('className="mt-3 grid grid-cols-1 gap-2 rounded-[18px]'),
    -1,
    "plus menu should expand below the input row as a panel",
  );
  assert.notEqual(
    source.indexOf('inline-flex w-[64px] flex-col items-center justify-center gap-2 text-center'),
    -1,
    "attachment panel should center the single album entry",
  );
  assert.notEqual(
    source.indexOf('onFocus={() => setShowAttachmentMenu(false)}'),
    -1,
    "focusing the input should close the attachment panel",
  );
  assert.equal(
    source.indexOf('absolute bottom-[62px]'),
    -1,
    "attachment menu should not render as the old floating popover",
  );
  assert.equal(
    source.indexOf('imageInputRef.current?.click();\n                setShowAttachmentMenu(false);'),
    -1,
    "choosing an image should not immediately close the attachment panel",
  );
  assert.notEqual(
    source.indexOf('t("cs.addImage")'),
    -1,
    "attachment menu should show an album action",
  );
  assert.notEqual(
    enLocale.indexOf('"addImage": "Album"'),
    -1,
    "English attachment label should say Album",
  );
  assert.notEqual(
    zhLocale.indexOf('"addImage": "相册"'),
    -1,
    "Chinese attachment label should say 相册",
  );
});

test("customer service only shows an icon send button when text is entered", () => {
  assert.notEqual(
    source.indexOf("function SendIcon()"),
    -1,
    "composer should use a paper-plane send icon",
  );
  assert.notEqual(
    source.indexOf("{input.trim() && ("),
    -1,
    "send icon should only render after the user enters non-whitespace content",
  );
  assert.notEqual(
    source.indexOf("<SendIcon />"),
    -1,
    "send button should render the icon instead of text",
  );
  assert.notEqual(
    source.indexOf("inline-flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-[#00FF9A]"),
    -1,
    "send icon button should use a stable square tap target when it appears",
  );
  assert.equal(
    source.indexOf('{sending || uploadingImage ? t("cs.sending") : t("cs.send")}'),
    -1,
    "composer should not render the old text send button",
  );
});

test("customer service loads chat history in one-day windows instead of revealing all messages", () => {
  assert.notEqual(
    source.indexOf("const CUSTOMER_MESSAGE_WINDOW_DAYS = 1;"),
    -1,
    "customer service should define a one-day history window",
  );
  assert.notEqual(
    source.indexOf("const [historyBefore, setHistoryBefore] = useState(null);"),
    -1,
    "customer service should track the next before cursor for older history",
  );
  assert.notEqual(
    source.indexOf("const [hasMoreHistory, setHasMoreHistory] = useState(false);"),
    -1,
    "customer service should track whether older history exists",
  );
  assert.notEqual(
    source.indexOf("async function loadInitialMessages(conversationId, currentVisitorToken)"),
    -1,
    "initial load should be isolated from older history loading",
  );
  assert.notEqual(
    source.indexOf("async function loadOlderMessages()"),
    -1,
    "customer service should load older messages one window at a time",
  );
  assert.notEqual(
    source.indexOf("before: historyBefore"),
    -1,
    "older history requests should use the current before cursor",
  );
});

test("customer service supports pull-down history loading and WeChat-style time separators", () => {
  assert.notEqual(
    source.indexOf("function handleMessageBoxScroll()"),
    -1,
    "message box should react to top scrolling for history loading",
  );
  assert.notEqual(
    source.indexOf("messageBoxRef.current.scrollTop <= CUSTOMER_HISTORY_SCROLL_THRESHOLD"),
    -1,
    "top scrolling should trigger older history loading near the top",
  );
  assert.notEqual(
    source.indexOf("function buildCustomerDisplayItems(list, language)"),
    -1,
    "messages should be transformed into mixed time/message display items",
  );
  assert.notEqual(
    source.indexOf("CUSTOMER_TIME_SEPARATOR_MINUTES = 5"),
    -1,
    "time separators should be inserted when messages are more than five minutes apart",
  );
  assert.notEqual(
    source.indexOf('item.type === "time"'),
    -1,
    "renderer should include time separator items",
  );
});

test("customer service anchors the latest message after opening and after image bubbles load", () => {
  assert.notEqual(
    source.indexOf("function scrollMessageBoxToBottom(behavior = \"auto\")"),
    -1,
    "customer service should centralize bottom anchoring without relying only on smooth scroll timing",
  );
  assert.notEqual(
    source.indexOf("scrollMessageBoxToBottom(\"auto\");"),
    -1,
    "initial message loads should force the box to the latest message",
  );
  assert.notEqual(
    source.indexOf("function handleMessageImageLoad()"),
    -1,
    "image bubbles should notify the scroll container after their height becomes known",
  );
  assert.notEqual(
    source.indexOf("onLoad={handleMessageImageLoad}"),
    -1,
    "rendered message images should trigger the post-load bottom anchoring hook",
  );
});
