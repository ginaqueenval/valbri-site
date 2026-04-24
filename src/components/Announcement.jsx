import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getContentList } from "../api/content";
import { resolveLocalizedAnnouncement } from "../utils/contentLocale.js";

export default function Announcement() {
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const fallbackText = t("home.badge");

  useEffect(() => {
    getContentList({ type: 1 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setAnnouncements(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border-b border-[#00FF9A]/10 bg-[#0B1220]/80">
        <div className="mx-auto max-w-6xl overflow-hidden py-2 px-4">
          <div className="flex items-center gap-2">
            <span className="h-4 w-16 animate-pulse rounded-full bg-[#00FF9A]/14" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-full animate-pulse rounded-full bg-white/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const joinedText = announcements
    .map((a) => resolveLocalizedAnnouncement(a, i18n.language))
    .filter((a) => a.title || a.content)
    .map((a) => (a.content ? `${a.title}: ${a.content}` : a.title))
    .join("   ●   ");
  const text = joinedText || fallbackText;

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .marquee-content {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
        }
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
      `}</style>

      <div className="border-b border-[#00FF9A]/10 bg-[#0B1220]/80">
        <div className="mx-auto max-w-6xl overflow-hidden py-2 px-4">
          <div className="marquee-container flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-[#00FF9A]">
              📢 {t("announcement.title")}
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="marquee-content text-xs text-[#9AA7BD]">
                {text} ● {text}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
