import { useTranslation } from "react-i18next";

export default function PlayerAuthLayout({ children, footer, mode }) {
  const { t } = useTranslation();
  const isRegister = mode === "register";

  return (
    <section className="player-auth-page">
      <div className="player-auth-net" aria-hidden="true">
        <i />
        <i />
        <i />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="player-auth-layout">
        <aside className="player-auth-hero" aria-hidden="true">
          <div className="player-auth-kicker">{t("auth.heroKicker")}</div>
          <h2>
            {t("auth.heroTitleLine1")}
            <br />
            {t("auth.heroTitleLine2")}
          </h2>
          <div className="player-auth-hologram">
            <div className="player-auth-ball">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <radialGradient id="soccerLineGlow" cx="34%" cy="28%" r="74%">
                    <stop offset="0%" stopColor="#ecfff6" stopOpacity="0.24" />
                    <stop offset="52%" stopColor="#00ff9a" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#00ff9a" stopOpacity="0.02" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="53" className="soccer-line-fill" />
                <circle cx="60" cy="60" r="53" className="soccer-rim soccer-glow-line" />
                <path
                  className="soccer-center-panel soccer-glow-line"
                  d="M47 34 73 33 88 50 83 76 62 91 40 80 34 53Z"
                />
                <path
                  className="soccer-seam soccer-glow-line"
                  d="M47 34 39 20 54 9 76 10 73 33"
                />
                <path
                  className="soccer-seam soccer-glow-line"
                  d="M34 53 18 45 10 62 15 83 34 93 40 80"
                />
                <path
                  className="soccer-seam soccer-glow-line"
                  d="M88 50 103 43 111 62 105 84 89 91 83 76"
                />
                <path
                  className="soccer-seam soccer-glow-line"
                  d="M62 91 61 108 41 108 24 99 34 93"
                />
                <path
                  className="soccer-seam soccer-glow-line"
                  d="M89 91 78 108 61 108 62 91"
                />
                <path
                  className="soccer-seam soccer-glow-line"
                  d="M18 45 29 24 39 20M76 10 95 24 103 43"
                />
                <path
                  className="soccer-edge-line soccer-glow-line"
                  d="M17 30C29 13 47 5 68 7M91 19C103 31 111 45 113 62M106 86C97 103 80 113 60 114M35 108C18 99 8 82 7 61M11 46C14 38 19 31 25 25"
                />
                <path className="soccer-highlight" d="M45 22C56 14 71 14 82 19" />
                <path className="soccer-highlight soccer-highlight-secondary" d="M76 39C84 42 90 48 94 56" />
              </svg>
            </div>
            <div className="player-auth-holo-copy">
              {t("auth.holoTitle")}
              <small>{t("auth.holoSubtitle")}</small>
            </div>
          </div>
        </aside>

        <div className="player-auth-wrap">
          <div className="player-auth-card">
            <div className="player-auth-brand">
              <div className="player-auth-crest">
                <span>V</span>
              </div>
              <div className="player-auth-brand-title">
                Valbri <small>FC26</small>
              </div>
              <h1>{isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}</h1>
            </div>
            {children}
            {footer}
          </div>
        </div>
      </div>
    </section>
  );
}
