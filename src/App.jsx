import { useState, useRef, useEffect, useCallback } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home.jsx";
import Fc26 from "./pages/Fc26.jsx";
import Checkout from "./pages/Checkout.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Orders from "./pages/Orders.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentCancel from "./pages/PaymentCancel.jsx";
import { LANGUAGES } from "./utils/languages.js";

const NAV_LINKS = [
  { to: "/fc26-coins", key: "header.nav.fc26" },
  { to: "/about", key: "header.nav.about" },
  { to: "/contact", key: "header.nav.contact" },
];

const MENU_LINKS = [...NAV_LINKS, { to: "/orders", key: "header.checkout" }];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HamburgerIcon({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5 transition-transform duration-200"
    >
      {open ? (
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
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("player_token"),
  );
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const menuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  const syncPendingCheckout = useCallback(() => {
    const token = localStorage.getItem("player_token");
    setHasPendingCheckout(
      !!token && !!sessionStorage.getItem("pending_checkout"),
    );
  }, []);

  const closeMenu = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setIsClosing(false);
    }, 230);
  }, []);

  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      closeMenu();
    } else {
      setIsClosing(false);
      setMenuOpen(true);
    }
  }, [menuOpen, closeMenu]);

  const handleLogout = () => {
    localStorage.removeItem("player_token");
    localStorage.removeItem("player_info");
    sessionStorage.removeItem("pending_checkout");
    setIsLoggedIn(false);
    setHasPendingCheckout(false);
    setShowLogoutConfirm(false);
    navigate("/home");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (menuOpen) closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("player_token"));
    syncPendingCheckout();
  }, [location.pathname, syncPendingCheckout]);

  useEffect(() => {
    const handler = () => syncPendingCheckout();
    window.addEventListener("pending-checkout-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("pending-checkout-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [syncPendingCheckout]);

  useEffect(() => {
    const handler = () => {
      setIsLoggedIn(false);
      setHasPendingCheckout(false);
      setShowSessionExpired(true);
    };
    window.addEventListener("player-session-expired", handler);
    return () => window.removeEventListener("player-session-expired", handler);
  }, []);

  const menuPanelClass = isClosing
    ? "menu-panel menu-panel-closing"
    : "menu-panel menu-panel-open";

  const renderMenuContent = (isMobile) => (
    <>
      {(isMobile
        ? MENU_LINKS
        : [{ to: "/orders", key: "header.checkout" }]
      ).map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={() => closeMenu()}
          className="flex items-center gap-2 px-4 py-3 text-sm text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7] transition-colors"
        >
          {t(l.key)}
        </Link>
      ))}
      {isMobile && hasPendingCheckout && (
        <Link
          to="/checkout"
          onClick={() => closeMenu()}
          className="flex items-center gap-2 px-4 py-3 text-sm text-[#00FF9A] font-semibold hover:bg-[#00FF9A]/10 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF9A] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00FF9A]" />
          </span>
          {t("header.pendingCheckout")}
        </Link>
      )}
      <div className="my-1 border-t border-white/10" />
      {isLoggedIn ? (
        <button
          onClick={() => {
            setShowLogoutConfirm(true);
            closeMenu();
          }}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
        >
          {t("auth.logout")}
        </button>
      ) : (
        <Link
          to="/login"
          onClick={() => closeMenu()}
          className="flex items-center gap-2 px-4 py-3 text-sm text-[#00FF9A] hover:bg-white/5 transition-colors"
        >
          {t("auth.login")}
        </Link>
      )}
      <div className="my-1 border-t border-white/10" />
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            i18n.changeLanguage(lang.code);
            localStorage.setItem("language", lang.code);
            closeMenu();
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
          <span className={i18n.language === lang.code ? "" : "ml-[1.375rem]"}>
            {lang.label}
          </span>
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070A0F] text-[#E7EDF7]">
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
            <Link
              to="/fc26-coins"
              className="rounded-xl bg-[#00FF9A] px-3 py-2 text-sm font-semibold text-[#070A0F] sm:px-4"
            >
              {t("header.buyBtn")}
            </Link>
            {hasPendingCheckout && (
              <Link
                to="/checkout"
                className="rounded-xl border border-[#00FF9A]/30 bg-[#00FF9A]/10 px-3 py-2 text-sm text-[#00FF9A] font-semibold relative"
              >
                {t("header.pendingCheckout")}
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00FF9A] animate-pulse" />
              </Link>
            )}

            <div className="relative" ref={menuRef}>
              {/* Desktop hamburger */}
              <button
                onClick={toggleMenu}
                className="hidden md:flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] transition-colors"
              >
                <HamburgerIcon open={menuOpen} />
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={toggleMenu}
                className="flex md:hidden items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] transition-colors"
              >
                <HamburgerIcon open={menuOpen} />
              </button>
              {menuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30 z-50 ${menuPanelClass}`}
                >
                  {/* Desktop menu */}
                  <div className="hidden md:block">
                    {renderMenuContent(false)}
                  </div>
                  {/* Mobile menu */}
                  <div className="md:hidden">{renderMenuContent(true)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B1220] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">
              {t("auth.logoutConfirmTitle")}
            </h3>
            <p className="mt-2 text-sm text-[#9AA7BD]">
              {t("auth.logoutConfirm")}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-colors"
              >
                {t("auth.logoutConfirmBtn")}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-[#00FF9A]/30 transition-colors"
              >
                {t("auth.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-amber-500/20 bg-[#0B1220] p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6 text-amber-400"
              >
                <path
                  fillRule="evenodd"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-center text-lg font-bold">
              {t("auth.sessionExpiredTitle")}
            </h3>
            <p className="mt-2 text-center text-sm text-[#9AA7BD]">
              {t("auth.sessionExpiredDesc")}
            </p>
            <Link
              to="/login"
              onClick={() => setShowSessionExpired(false)}
              className="mt-5 block w-full rounded-xl bg-[#00FF9A] py-2.5 text-center text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E] transition-colors"
            >
              {t("auth.reLogin")}
            </Link>
          </div>
        </div>
      )}

      <ScrollToTop />

      {location.pathname !== "/home" && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            {t("header.back")}
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/fc26-coins" element={<Fc26 />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
