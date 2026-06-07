import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function PageReveal({ children, className = "", as = "div" }) {
  return createElement(as, { className: `reveal-up ${className}` }, children);
}

// 双向 reveal — 进入视口 fade-in,离开视口 fade-out,再次进入再次 fade-in。
// 无方向 transform(纯 scale + blur),向上向下滚动完全镜像对称。
// 用于列表型页面(Home、Cart、Orders)的丝滑滚动体验。
export function ScrollReveal({
  children,
  className = "",
  as = "div",
  threshold = 0.15,
  delay = 0,
}) {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setVisible(entry.isIntersecting)),
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  const style = visible
    ? {
        opacity: 1,
        transform: "scale(1)",
        filter: "blur(0)",
        transitionDelay: `${delay}ms`,
      }
    : {
        opacity: 0,
        transform: "scale(0.97)",
        filter: "blur(6px)",
      };

  return createElement(
    as,
    {
      ref: setNode,
      className,
      style: {
        transition:
          "opacity 0.85s var(--ease-apple-out), transform 0.85s var(--ease-apple-out), filter 0.85s var(--ease-apple-out)",
        ...style,
      },
    },
    children,
  );
}

export function MotionSection({
  children,
  className = "",
  as = "section",
  threshold = 0.15,
  delay = 0,
}) {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  const style = visible
    ? {
        opacity: 1,
        transform: "translateY(0) scale(1)",
        filter: "blur(0)",
        transitionDelay: `${delay}ms`,
      }
    : {
        opacity: 0,
        transform: "translateY(24px) scale(0.985)",
        filter: "blur(6px)",
      };

  return createElement(
    as,
    {
      ref: setNode,
      className,
      style: {
        transition:
          "opacity 0.85s var(--ease-apple-out), transform 0.85s var(--ease-apple-out), filter 0.85s var(--ease-apple-out)",
        ...style,
      },
    },
    children,
  );
}

export function PrimaryCTA({
  children,
  to,
  href,
  type = "button",
  className = "",
  size = "md",
  ...rest
}) {
  const sizeClass =
    size === "lg"
      ? "px-8 py-4 text-base"
      : size === "sm"
        ? "px-4 py-2 text-xs"
        : "px-6 py-3 text-sm";
  const cls = `cta-primary ${sizeClass} ${className}`.trim();
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

const STATUS_TONE = {
  success: "border-[#00FF9A]/22 bg-[#00FF9A]/10 text-[#00FF9A]",
  pending: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  warning: "border-orange-400/24 bg-orange-500/10 text-orange-200",
  danger: "border-red-400/24 bg-red-500/10 text-red-200",
  info: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
  muted: "border-white/10 bg-white/5 text-[#9AA7BD]",
  accent: "border-[#00FF9A]/30 bg-[#00FF9A]/8 text-[#7BFFCA]",
};

export function StatusBadge({ tone = "muted", children, dot = true, className = "" }) {
  const toneClass = STATUS_TONE[tone] || STATUS_TONE.muted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] ${toneClass} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div
      className={`mx-auto flex max-w-md flex-col items-center rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-[#9AA7BD]">
          {icon}
        </div>
      )}
      {title && (
        <div className="text-base font-semibold text-[#E7EDF7]">{title}</div>
      )}
      {description && (
        <p className="mt-2 text-sm leading-6 text-[#9AA7BD]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
