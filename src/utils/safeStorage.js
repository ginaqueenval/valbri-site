import { isStorageWriteAllowed } from "./consentStorage.js";

/**
 * safeStorage — 防御性 localStorage 封装
 *
 * 浏览器 storage 在以下场景会抛错,裸 localStorage.* 调用可能造成白屏 / 功能崩塌:
 *   - Safari 严格 ITP / 跨站 iframe / 隐私模式 → SecurityError
 *   - Storage 配额已满 / Safari 隐私模式下 setItem → QuotaExceededError
 *   - SSR / Node 测试环境无 window.localStorage → ReferenceError
 *   - 企业策略禁用 storage / Brave shields → SecurityError
 *
 * 三个 helper 均吞掉异常,失败时返回安全 fallback,绝不向调用方抛出。
 * storage 参数允许显式注入(主要供测试,默认走 globalThis.localStorage)。
 */

function resolveStorage(storage) {
  if (storage !== undefined) {
    return storage ?? null;
  }
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // 极端浏览器策略:仅访问 localStorage 引用本身就抛 SecurityError
    return null;
  }
}

export function safeGetItem(key, fallback = null, storage) {
  const target = resolveStorage(storage);
  if (!target) return fallback;
  if (!isStorageWriteAllowed(key, { storage: target })) return fallback;
  try {
    const value = target.getItem(key);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeSetItem(key, value, storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  if (!isStorageWriteAllowed(key, { storage: target })) return false;
  try {
    target.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key, storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
