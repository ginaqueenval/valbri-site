export function SupportIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.75 9.75a5.25 5.25 0 1 1 10.5 0v3.3a1.95 1.95 0 0 1-1.95 1.95H14.4a1.2 1.2 0 0 0-1.2 1.2v.1a1.95 1.95 0 1 1-3.9 0v-1.16" />
      <path d="M6.75 14.25h-.45a1.8 1.8 0 0 1-1.8-1.8v-1.8a1.8 1.8 0 0 1 1.8-1.8h.45" />
      <path d="M17.25 9h.45a1.8 1.8 0 0 1 1.8 1.8v1.8a1.8 1.8 0 0 1-1.8 1.8h-.45" />
    </svg>
  );
}

export function MinimizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M4.25 10a.75.75 0 0 1 .75-.75h10a.75.75 0 1 1 0 1.5H5A.75.75 0 0 1 4.25 10Z" />
    </svg>
  );
}

export function HistoryChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-[#9EFED1]"
    >
      <path d="M4.5 7.25 10 12.75l5.5-5.5" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <path d="m6 13 3.2-3.2 2.2 2.2 1.3-1.3L16 14" />
      <circle cx="7.5" cy="7.5" r="1" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M17 3 8.2 11.8" />
      <path d="m17 3-5.6 14-3.2-5.2L3 8.6 17 3Z" />
    </svg>
  );
}
