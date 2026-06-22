export const COIN_PRODUCT_TYPE = "coin";
export const SBC_PRODUCT_TYPE = "sbc";

export const PRODUCT_TYPES = [COIN_PRODUCT_TYPE, SBC_PRODUCT_TYPE];

const PRODUCT_PLATFORMS = {
  [COIN_PRODUCT_TYPE]: ["PlayStation", "Xbox", "PC"],
  [SBC_PRODUCT_TYPE]: ["PS/Xbox", "PC"],
};

const PRODUCT_TYPE_DISPLAY_META = {
  [COIN_PRODUCT_TYPE]: {
    icon: "coin",
    shortLabel: "Coins",
  },
  [SBC_PRODUCT_TYPE]: {
    icon: "sbc",
    shortLabel: "SBC",
  },
};

const PLATFORM_DISPLAY_META = {
  PlayStation: {
    icon: "playstation",
    shortLabel: "PlayStation",
  },
  Xbox: {
    icon: "xbox",
    shortLabel: "Xbox",
  },
  PC: {
    icon: "pc",
    shortLabel: "PC",
  },
  "PS/Xbox": {
    icon: "console",
    shortLabel: "PS/Xbox",
  },
};

export function normalizeProductType(productType) {
  return PRODUCT_TYPES.includes(productType) ? productType : COIN_PRODUCT_TYPE;
}

export function getPlatformsForProductType(productType) {
  return PRODUCT_PLATFORMS[normalizeProductType(productType)];
}

export function getProductTypeDisplayMeta(productType) {
  return PRODUCT_TYPE_DISPLAY_META[normalizeProductType(productType)];
}

export function getPlatformDisplayMeta(platform) {
  return (
    PLATFORM_DISPLAY_META[platform] || {
      icon: "console",
      shortLabel: platform || "",
    }
  );
}

export function getDefaultPlatform(productType) {
  return getPlatformsForProductType(productType)[0];
}

export function buildCartItemPayload({ pkg, productType, platform, quantity }) {
  const normalizedProductType = normalizeProductType(productType);
  return {
    packageId: pkg.id,
    productType: normalizedProductType,
    platform,
    quantity: normalizedProductType === SBC_PRODUCT_TYPE ? 1 : quantity,
  };
}
