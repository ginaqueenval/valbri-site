import { useState } from "react";

/**
 * 星级评分组件
 * - readOnly:展示模式(支持半星)
 * - 交互模式:1-5 整星选择,hover 预览
 *
 * Props:
 *   value       当前评分(0-5,可小数)
 *   onChange    交互模式回调 (next) => void
 *   readOnly    是否只读
 *   size        sm/md/lg/xl
 *   showValue   是否在右侧显示数字
 */
const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-9 w-9",
};

const VALUE_SIZES = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

function Star({ fill, sizeClass, onMouseEnter, onClick, interactive }) {
  return (
    <button
      type="button"
      tabIndex={interactive ? 0 : -1}
      disabled={!interactive}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`relative inline-block ${sizeClass} ${
        interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"
      }`}
      aria-hidden={!interactive}
    >
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full text-white/15" fill="currentColor">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full text-[#FFC233]"
        fill="currentColor"
        style={{
          clipPath: `polygon(0 0, ${Math.min(100, Math.max(0, fill * 100))}% 0, ${Math.min(100, Math.max(0, fill * 100))}% 100%, 0 100%)`,
        }}
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
      </svg>
    </button>
  );
}

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = "md",
  showValue = false,
  className = "",
}) {
  const [hover, setHover] = useState(0);
  const interactive = !readOnly && typeof onChange === "function";
  const display = interactive && hover > 0 ? hover : value;
  const sizeClass = SIZES[size] || SIZES.md;
  const valueClass = VALUE_SIZES[size] || VALUE_SIZES.md;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      onMouseLeave={interactive ? () => setHover(0) : undefined}
      role={interactive ? "radiogroup" : "img"}
      aria-label={readOnly ? `${value.toFixed(1)} / 5` : undefined}
    >
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.min(1, Math.max(0, display - (n - 1)));
          return (
            <Star
              key={n}
              fill={fill}
              sizeClass={sizeClass}
              interactive={interactive}
              onMouseEnter={interactive ? () => setHover(n) : undefined}
              onClick={interactive ? () => onChange(n) : undefined}
            />
          );
        })}
      </span>
      {showValue && (
        <span className={`font-bold tracking-tight text-[#FFC233] ${valueClass}`}>
          {Number(value || 0).toFixed(1)}
        </span>
      )}
    </span>
  );
}
