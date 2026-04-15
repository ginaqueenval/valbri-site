import { useState, useRef, useEffect } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home.jsx";
import Fc26 from "./pages/Fc26.jsx";
import Checkout from "./pages/Checkout.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import { LANGUAGES } from "./utils/languages.js";

const NAV_LINKS = [
  { to: "/fc26-coins", key: "header.nav.fc26" },
  { to: "/about", key: "header.nav.about" },
  { to: "/contact", key: "header.nav.contact" },
];

const MOBILE_MENU_LINKS = [
  ...NAV_LINKS,
  { to: "/checkout", key: "header.checkout" },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#E7EDF7]">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070A0F]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/home" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-[#00FF9A]/25 bg-[#0B1220] grid place-items-center">
              <span className="text-sm font-semibold text-[#00FF9A]">V</span>
            </div>
            <div>
              <div className="text-sm font-semibold">{t("header.brand")}</div>
              <div className="text-xs text-[#9AA7BD]">
                {t("header.brandSubtitle")}
              </div>
            </div>
          </Link>

          <nav className="hidden gap-6 text-sm text-[#9AA7BD] md:flex">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-[#E7EDF7]">
                {t(l.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <Link
              to="/fc26-coins"
              className="rounded-xl bg-[#00FF9A] px-3 py-2 text-sm font-semibold text-[#070A0F] sm:px-4"
            >
              {t("header.buyBtn")}
            </Link>
            <Link
              to="/checkout"
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm md:inline-flex"
            >
              {t("header.checkout")}
            </Link>
            <div className="relative md:hidden" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  {menuOpen ? (
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30 z-50">
                  {MOBILE_MENU_LINKS.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7] transition-colors"
                    >
                      {t(l.key)}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-white/10" />
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        localStorage.setItem("language", lang.code);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors ${
                        i18n.language === lang.code
                          ? "text-[#00FF9A] bg-[#00FF9A]/10"
                          : "text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7]"
                      }`}
                    >
                      {i18n.language === lang.code && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span
                        className={
                          i18n.language === lang.code ? "" : "ml-[1.375rem]"
                        }
                      >
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ScrollToTop />

      <Routes>
        {/* ✅ وقتی لینک اصلی باز شد، مستقیم بره Home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* صفحات */}
        <Route path="/home" element={<Home />} />
        <Route path="/fc26-coins" element={<Fc26 />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* ✅ هر مسیر اشتباه -> Home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-[#9AA7BD]">
          <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-[#E7EDF7]">
              {t("footer.terms")}
            </Link>
            <Link to="/privacy" className="hover:text-[#E7EDF7]">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
