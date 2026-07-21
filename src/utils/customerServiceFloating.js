export const CUSTOMER_SERVICE_FLOATING_STORAGE_KEY = "cs_floating_position";
export const CUSTOMER_SERVICE_MOBILE_BREAKPOINT = 768;
export const CUSTOMER_SERVICE_FLOATING_PADDING = 18;
export const CUSTOMER_SERVICE_FLOATING_GAP = 14;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDefaultFloatingPosition(
  viewport,
  {
    buttonSize = 60,
    padding = CUSTOMER_SERVICE_FLOATING_PADDING,
    topPadding = padding,
  } = {},
) {
  return {
    x: Math.max(padding, viewport.width - buttonSize - padding),
    y: Math.max(topPadding, viewport.height - buttonSize - padding),
  };
}

// 拖动中使用 — 仅夹回视口内,不吸附,允许自由拖动
export function clampFloatingPosition(
  position,
  viewport,
  {
    buttonSize = 60,
    padding = CUSTOMER_SERVICE_FLOATING_PADDING,
    topPadding = padding,
  } = {},
) {
  if (!position || Number.isNaN(position.x) || Number.isNaN(position.y)) {
    return getDefaultFloatingPosition(viewport, { buttonSize, padding, topPadding });
  }
  return clampToViewport(position, viewport, buttonSize, padding, topPadding);
}

function clampToViewport(position, viewport, buttonSize, padding, topPadding = padding) {
  return {
    x: clamp(position.x, padding, Math.max(padding, viewport.width - buttonSize - padding)),
    y: clamp(position.y, topPadding, Math.max(topPadding, viewport.height - buttonSize - padding)),
  };
}

// 仅吸附到左右两侧 — 垂直位置保留(夹在视口内),水平向最近边贴齐
// 跨平台一致:桌面与移动端皆走此逻辑
function snapToHorizontalEdge(position, viewport, buttonSize, padding, topPadding = padding) {
  const clamped = clampToViewport(position, viewport, buttonSize, padding, topPadding);
  const distLeft = clamped.x - padding;
  const distRight = viewport.width - buttonSize - padding - clamped.x;
  if (distLeft <= distRight) {
    return { x: padding, y: clamped.y };
  }
  return {
    x: Math.max(padding, viewport.width - buttonSize - padding),
    y: clamped.y,
  };
}

export function normalizeFloatingPosition(
  position,
  viewport,
  {
    buttonSize = 60,
    padding = CUSTOMER_SERVICE_FLOATING_PADDING,
    topPadding = padding,
    // 保留 mobile 参数以兼容调用方,但行为统一:左右吸附
    // eslint-disable-next-line no-unused-vars
    mobile = false,
  } = {},
) {
  if (!position || Number.isNaN(position.x) || Number.isNaN(position.y)) {
    return getDefaultFloatingPosition(viewport, { buttonSize, padding, topPadding });
  }
  return snapToHorizontalEdge(position, viewport, buttonSize, padding, topPadding);
}

export function getDesktopPanelPosition(
  position,
  viewport,
  {
    buttonSize = 60,
    panelWidth = 400,
    panelHeight = 620,
    padding = CUSTOMER_SERVICE_FLOATING_PADDING,
    gap = CUSTOMER_SERVICE_FLOATING_GAP,
  } = {},
) {
  const spaceRight = viewport.width - (position.x + buttonSize + gap + panelWidth);
  const side = spaceRight >= padding ? "right" : "left";
  const x =
    side === "right"
      ? position.x + buttonSize + gap
      : Math.max(padding, position.x - panelWidth - gap);
  const y = clamp(
    position.y + buttonSize - panelHeight,
    padding,
    Math.max(padding, viewport.height - panelHeight - padding),
  );

  return { x, y, side };
}

export function parseStoredFloatingPosition(rawValue) {
  if (!rawValue) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawValue);
    if (
      typeof parsed?.x === "number" &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    return null;
  }
  return null;
}
