import { useTranslation } from "react-i18next";
import { resolveNoteTag } from "../utils/packageDisplay";

// 七徽营销体系 — 每个 SVG 独立造型,统一 24x24 viewBox,
// currentColor 驱动,由 .pkg-note-pill 给金色调。

function HotIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3.2c1.4 2.4 3.6 4 3.6 6.8 0 2.3-1 4-2.4 4.8.6-1 .9-2 .9-3-.4 1-1 1.7-1.8 2.2-2 1.2-3.7-.4-3-2.6.4-1.2-.2-2-1-2.4 1.6-.4 3-2.4 3.7-5.8z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M12 3.2c1.4 2.4 3.6 4 3.6 6.8 0 2.3-1 4-2.4 4.8.6-1 .9-2 .9-3-.4 1-1 1.7-1.8 2.2-2 1.2-3.7-.4-3-2.6.4-1.2-.2-2-1-2.4 1.6-.4 3-2.4 3.7-5.8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11 14.6c.6.4 1.2.6 1.8.4 1-.4 1.4-1.6.6-2.2-.4-.3-.5-.8-.3-1.3.4 0 1 .3 1.6 1 1 1.2 1 3.2-.6 4.4-1.2.9-3 .7-3.7-.7-.5-1 .1-1.8.6-1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChampionIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7.5 4.5h9V10a4.5 4.5 0 0 1-9 0V4.5z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M7.5 4.5h9V10a4.5 4.5 0 0 1-9 0V4.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 5.6H4.8v1.8a3 3 0 0 0 2.7 3M16.5 5.6h2.7v1.8a3 3 0 0 1-2.7 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 14.5h4M9 19h6M9.5 17h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.5 14.5l-.3 2.5M13.5 14.5l.3 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function DealIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 9l3-4.5h8L19 9l-7 11L5 9z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M5 9l3-4.5h8L19 9l-7 11L5 9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 9h14M9 9l3 11M15 9l-3 11M9 9l-1-4.5M15 9l1-4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlashIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M13.5 2 5 13h5.5l-2 9 9-13h-5.5l1.5-7z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M13.5 2 5 13h5.5l-2 9 9-13h-5.5l1.5-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BulkIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" fill="currentColor" opacity="0.22" />
      <ellipse
        cx="12"
        cy="6.5"
        rx="7"
        ry="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 6.5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 10.5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14.5v3c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <ellipse cx="12" cy="14.5" rx="7" ry="2.5" fill="currentColor" opacity="0.14" />
      <ellipse cx="12" cy="10.5" rx="7" ry="2.5" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

function CrownIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3.5 7.5 7 12l5-7 5 7 3.5-4.5L19 19H5L3.5 7.5z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M3.5 7.5 7 12l5-7 5 7 3.5-4.5L19 19H5L3.5 7.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="3.5" cy="7.5" r="1.2" fill="currentColor" />
      <circle cx="20.5" cy="7.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="4.8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="14" r="1.4" fill="currentColor" />
      <path d="M7 19h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RocketIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2.5c2.6 0 4.5 2.8 4.5 6.5v5.5h-3.5L12 18l-1-3.5H7.5V9c0-3.7 1.9-6.5 4.5-6.5z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M12 2.5c2.6 0 4.5 2.8 4.5 6.5v5.5h-3.5L12 18l-1-3.5H7.5V9c0-3.7 1.9-6.5 4.5-6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8.4" r="1.6" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M9.5 17.5 8 21M14.5 17.5 16 21M12 18.5l.4 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11 5 10l1 3M16.5 11l2.5-1-1 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON_BY_TAG = {
  hot: HotIcon,
  champion: ChampionIcon,
  deal: DealIcon,
  flash: FlashIcon,
  bulk: BulkIcon,
  crown: CrownIcon,
  rocket: RocketIcon,
};

export default function NoteBadge({ tag, className = "" }) {
  const { t } = useTranslation();
  const canonical = resolveNoteTag(tag);
  if (!canonical) return null;
  const Icon = ICON_BY_TAG[canonical];
  const labelKey = `notes.${canonical}`;
  const label = t(labelKey);
  const text = label === labelKey ? canonical : label;
  return (
    <span
      className={`pkg-note-pill inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${className}`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {text}
    </span>
  );
}
