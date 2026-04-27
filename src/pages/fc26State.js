export const MAX_QTY = 10;

export function getPackageQuantity(quantities, packageId) {
  return quantities[packageId] || 1;
}

export function updatePackageQuantity(quantities, packageId, nextValue) {
  const quantity = Math.max(1, Math.min(MAX_QTY, nextValue));
  return {
    ...quantities,
    [packageId]: quantity,
  };
}

export function resetPackageQuantity(quantities, packageId) {
  if (!(packageId in quantities)) {
    return quantities;
  }
  const nextQuantities = { ...quantities };
  delete nextQuantities[packageId];
  return nextQuantities;
}

export function getDesktopOverlayStateClasses(isHovered) {
  return isHovered
    ? "pointer-events-auto z-10 translate-y-0 opacity-100"
    : "pointer-events-none translate-y-4 opacity-0";
}
