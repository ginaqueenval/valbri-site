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
  } = {},
) {
  return {
    x: Math.max(padding, viewport.width - buttonSize - padding),
    y: Math.max(padding, viewport.height - buttonSize - padding),
  };
}

function clampToViewport(position, viewport, buttonSize, padding) {
  return {
    x: clamp(position.x, padding, Math.max(padding, viewport.width - buttonSize - padding)),
    y: clamp(position.y, padding, Math.max(padding, viewport.height - buttonSize - padding)),
  };
}

function snapToMobileEdge(position, viewport, buttonSize, padding) {
  const clamped = clampToViewport(position, viewport, buttonSize, padding);
  const distances = {
    left: clamped.x - padding,
    right: viewport.width - buttonSize - padding - clamped.x,
    top: clamped.y - padding,
    bottom: viewport.height - buttonSize - padding - clamped.y,
  };
  const edge = Object.entries(distances).sort((a, b) => a[1] - b[1])[0]?.[0] || "right";

  switch (edge) {
    case "left":
      return { x: padding, y: clamped.y };
    case "right":
      return {
        x: Math.max(padding, viewport.width - buttonSize - padding),
        y: clamped.y,
      };
    case "top":
      return { x: clamped.x, y: padding };
    case "bottom":
    default:
      return {
        x: clamped.x,
        y: Math.max(padding, viewport.height - buttonSize - padding),
      };
  }
}

export function normalizeFloatingPosition(
  position,
  viewport,
  {
    buttonSize = 60,
    padding = CUSTOMER_SERVICE_FLOATING_PADDING,
    mobile = false,
  } = {},
) {
  if (!position || Number.isNaN(position.x) || Number.isNaN(position.y)) {
    return getDefaultFloatingPosition(viewport, { buttonSize, padding });
  }
  return mobile
    ? snapToMobileEdge(position, viewport, buttonSize, padding)
    : clampToViewport(position, viewport, buttonSize, padding);
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
