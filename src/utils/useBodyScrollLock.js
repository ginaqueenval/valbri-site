import { useEffect } from "react";

/**
 * useBodyScrollLock — iOS Safari 兼容的「锁背景」hook
 *
 * 痛点:
 *   - iOS Safari 上,即使 modal 是 fixed inset-0,触摸滚动仍能透过到 body
 *     (scroll chaining / 滚动链),尤其是 modal 内部 overflow-y-auto 到顶/底边界后
 *   - 单纯 `body.style.overflow = "hidden"` 在 iOS 上无效,必须 `position: fixed`
 *     才能完全冻结背景
 *
 * 解法(iOS 通用经典):
 *   锁定时:保存当前 scrollY → body 设为 position:fixed; top:-scrollY; overflow:hidden; width:100%
 *   释放时:还原全部 style,并 window.scrollTo(0, scrollY) 回滚位置
 *
 * 嵌套安全:
 *   模块级 lockCount + savedStyles 单实例机制 —— 多个 modal 同时打开时,
 *   只在第一个 lock 时应用样式,最后一个 unlock 时释放。
 *
 * 用法:
 *   useBodyScrollLock(open);  // open 为 true 时锁,false 时解锁
 */

// 模块级单例 — 支持多 modal 嵌套时的计数引用
let lockCount = 0;
let savedScrollY = 0;
let savedStyles = null;

function applyLock() {
  if (typeof document === "undefined") return;
  savedScrollY = window.scrollY || window.pageYOffset || 0;
  savedStyles = {
    overflow: document.body.style.overflow,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
  };
  document.body.style.overflow = "hidden";
  // position:fixed 是 iOS Safari 必需 — 单 overflow:hidden 无法阻止触摸滚动透传
  document.body.style.position = "fixed";
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.width = "100%";
}

function releaseLock() {
  if (typeof document === "undefined" || !savedStyles) return;
  document.body.style.overflow = savedStyles.overflow;
  document.body.style.position = savedStyles.position;
  document.body.style.top = savedStyles.top;
  document.body.style.width = savedStyles.width;
  savedStyles = null;
  // 复位滚动位置,避免 modal 关闭后页面跳到顶部
  window.scrollTo(0, savedScrollY);
}

export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    if (lockCount === 0) applyLock();
    lockCount += 1;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [locked]);
}
