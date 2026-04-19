import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getContentList } from "../api/content";

export default function Announcement() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getContentList({ type: 1 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setAnnouncements(res.data);
        }
      })
      .catch(() => {});
  }, []);

  if (announcements.length === 0) return null;

  const text = announcements
    .map((a) => (a.content ? `${a.title}: ${a.content}` : a.title))
    .join("   ●   ");

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
