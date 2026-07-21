import { useEffect } from "react";

/**
 * SuccessToast — Apple snackbar 同源的通用成功提示
 *
 * 复用 Cart Undo Toast 视觉(.cart-undo-toast + .cart-undo-progress),
 * 但移除「撤销」按钮、缩短自动关闭时长、统一 ✓ icon。
 *
 * 用法:
 *   const [message, setMessage] = useState("");
 *   <SuccessToast
 *     message={message}
 *     duration={3000}
 *     onDismiss={() => setMessage("")}
 *   />
 *
 * 隐藏方式:message 设为空字符串 / null / undefined。
 */
export default function SuccessToast({
  message,
  duration = 3000,
  onDismiss,
}) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="cart-undo-toast pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-white/12 bg-[#0B1220]/95 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 text-[#7BFFCA]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6.5" stroke="rgba(123,255,202,0.3)" strokeWidth="1.2" />
            <path d="M5 8.4 7 10.3 11 6" />
          </svg>
          <span className="text-sm font-semibold text-[#E7EDF7]">
            {message}
          </span>
        </div>
        {/* 倒计时进度条 — 复用 Cart Undo 同款,duration 自定义(默认 3s) */}
        <span
          className="cart-undo-progress"
          style={{ animationDuration: `${duration}ms` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
