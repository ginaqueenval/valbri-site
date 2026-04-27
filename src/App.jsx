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
import Cart from "./pages/Cart.jsx";
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
import CustomerService from "./components/CustomerService.jsx";
import { LANGUAGES } from "./utils/languages.js";
import { getCartCount } from "./api/cart";
import { getPlayerDisplayName } from "./utils/playerProfile.js";
import {
  clearStoredPlayerSession,
  getStoredPlayerSession,
  getStoredPlayerToken,
  PLAYER_AUTH_CHANGED_EVENT,
  PLAYER_SESSION_EXPIRED_EVENT,
} from "./utils/playerAuth.js";

const NAV_LINKS = [
  { to: "/fc26-coins", key: "header.nav.fc26" },
  { to: "/about", key: "header.nav.about" },
  { to: "/contact", key: "header.nav.contact" },
];

const ACCOUNT_LINKS = [
  { to: "/cart", key: "header.cart" },
  { to: "/orders", key: "header.checkout" },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProfileMenuIcon({ open, loggedIn }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 transition-all duration-200 ${open ? "scale-[1.06]" : ""}`}
    >
      <path d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0Z" />
      <path d="M4.5 19.25a7.5 7.5 0 0 1 15 0" />
      {loggedIn && (
        <circle
          cx="18.3"
          cy="5.7"
          r="1.8"
          fill="currentColor"
          stroke="none"
          className={open ? "opacity-100" : "opacity-80"}
        />
      )}
    </svg>
  );
}

function ShoppingCartIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        d="M7.12 6.35a.9.9 0 0 0-.86-.65H4.95a.9.9 0 1 0 0 1.8h.65l1.34 5.22a1.65 1.65 0 0 0 1.6 1.24h7.07a1.66 1.66 0 0 0 1.58-1.16l1.02-3.2a1.18 1.18 0 0 0-1.12-1.54H8.3l-.26-1.05a.9.9 0 0 0-.92-.66Zm1.62 9.98a1.28 1.28 0 1 0 0 2.56 1.28 1.28 0 0 0 0-2.56Zm6.86 0a1.28 1.28 0 1 0 0 2.56 1.28 1.28 0 0 0 0-2.56Z"
      />
    </svg>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [desktopLanguageOpen, setDesktopLanguageOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartPulseActive, setCartPulseActive] = useState(false);
  const menuRef = useRef(null);
  const cartPulseTimeoutRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [authSession, setAuthSession] = useState(() => getStoredPlayerSession());
  const isLoggedIn = !!authSession.token;
  const playerInfo = authSession.player;

  const playerDisplayName = getPlayerDisplayName(playerInfo);
  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];
  const syncCartCount = useCallback(async () => {
    const token = getStoredPlayerToken();
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await getCartCount();
      setCartCount(Number(res.data || 0));
    } catch {
      setCartCount(0);
    }
  }, []);

  const closeMenu = useCallback(() => {
    setDesktopMenuOpen(false);
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
    clearStoredPlayerSession({ reason: "logout" });
    setCartCount(0);
    setShowLogoutConfirm(false);
    navigate("/home");
  };

  const changeLanguage = useCallback(
    (langCode, closeAfterChange = false) => {
      i18n.changeLanguage(langCode);
      localStorage.setItem("language", langCode);
      if (closeAfterChange) {
        closeMenu();
      }
    },
    [closeMenu, i18n],
  );

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
    const syncAuthSession = () => {
      setAuthSession(getStoredPlayerSession());
    };
    window.addEventListener(PLAYER_AUTH_CHANGED_EVENT, syncAuthSession);
    window.addEventListener("storage", syncAuthSession);
    return () => {
      window.removeEventListener(PLAYER_AUTH_CHANGED_EVENT, syncAuthSession);
      window.removeEventListener("storage", syncAuthSession);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      syncCartCount();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, isLoggedIn, syncCartCount]);

  useEffect(() => {
    const handler = () => syncCartCount();
    window.addEventListener("cart-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cart-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [syncCartCount]);

  useEffect(() => {
    const handler = () => {
      if (cartPulseTimeoutRef.current) {
        window.clearTimeout(cartPulseTimeoutRef.current);
      }
      setCartPulseActive(true);
      cartPulseTimeoutRef.current = window.setTimeout(() => {
        setCartPulseActive(false);
        cartPulseTimeoutRef.current = null;
      }, 850);
    };

    window.addEventListener("cart-feedback", handler);
    return () => {
      window.removeEventListener("cart-feedback", handler);
      if (cartPulseTimeoutRef.current) {
        window.clearTimeout(cartPulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      setCartCount(0);
      setShowSessionExpired(true);
    };
    window.addEventListener(PLAYER_SESSION_EXPIRED_EVENT, handler);
    return () =>
      window.removeEventListener(PLAYER_SESSION_EXPIRED_EVENT, handler);
  }, []);

  const menuPanelClass = isClosing
    ? "menu-panel menu-panel-closing"
    : "menu-panel menu-panel-open";

  const renderMenuContent = (isMobile) => (
    <>
      {isLoggedIn && playerDisplayName && (
        <>
          <div
            className={`cursor-default select-none rounded-[22px] border border-[#00FF9A]/18 bg-[radial-gradient(circle_at_top,rgba(0,255,154,0.16),rgba(11,18,32,0.95)_72%)] px-4 py-4 text-center shadow-[0_0_0_1px_rgba(0,255,154,0.05),0_18px_34px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.06)] ${
              isMobile ? "mx-3 mb-2 mt-3 pb-5" : "mx-2 mb-2 mt-3"
            }`}
          >
            <div
              className={`mx-auto mb-3 flex items-center justify-center rounded-full border border-[#7BFFCA]/45 bg-[radial-gradient(circle_at_30%_30%,rgba(217,255,237,0.92),rgba(0,255,154,0.28)_45%,rgba(4,17,24,0.96)_100%)] shadow-[0_0_0_1px_rgba(0,255,154,0.12),0_0_22px_rgba(0,255,154,0.22)] ${
                isMobile ? "h-12 w-12" : "h-11 w-11"
              }`}
            >
              <span
                className={`bg-[linear-gradient(180deg,#F5FFF9_0%,#B8FFD9_100%)] bg-clip-text font-black tracking-[0.16em] text-transparent drop-shadow-[0_0_10px_rgba(0,255,154,0.2)] ${
                  isMobile ? "text-[18px]" : "text-[17px]"
                }`}
              >
                {playerDisplayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div
              className={`truncate bg-[linear-gradient(135deg,#F4FFF9_0%,#B9FFD8_48%,#39F1A2_100%)] bg-clip-text font-black tracking-[0.08em] text-transparent drop-shadow-[0_0_18px_rgba(0,255,154,0.22)] ${
                isMobile ? "text-[16px]" : "text-[15px]"
              }`}
            >
              {playerDisplayName}
            </div>
            {isMobile && (
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9CF6C9]/60">
                Player Center
              </div>
            )}
          </div>
          {!isMobile && <div className="my-1 border-t border-white/10" />}
        </>
      )}
      {(isMobile
        ? [...ACCOUNT_LINKS, ...NAV_LINKS]
        : ACCOUNT_LINKS.filter((link) => link.to !== "/cart")
      ).map(
        (l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={() => closeMenu()}
          className={`text-sm transition-colors ${
            l.to === "/cart"
              ? isMobile
                ? "mx-3 flex min-h-[46px] items-center justify-center rounded-[18px] border-t border-white/8 px-4 text-center text-[#00FF9A] transition-colors first:border-t-0 hover:bg-white/5 hover:text-[#8DFFC9]"
                : "flex items-center gap-2 px-4 py-3 text-[#00FF9A] hover:bg-[#00FF9A]/10 hover:text-[#7CFFC4]"
              : isMobile
                ? "mx-3 flex min-h-[46px] items-center justify-center border-t border-white/8 px-4 text-center text-[#DCE6F4] transition-colors first:border-t-0 hover:bg-white/5 hover:text-[#E7EDF7]"
                : "flex items-center justify-center px-4 py-3 text-center text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7]"
          }`}
        >
          {l.to === "/cart" ? (
            <>
              {isMobile ? (
                <span className="flex items-center justify-center gap-2">
                  <span>{t(l.key)}</span>
                  {cartCount > 0 && (
                    <span className="min-w-[18px] rounded-full border border-[#00FF9A]/28 bg-[#00FF9A]/10 px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#00FF9A]">
                      {cartCount}
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center justify-center">
                    <ShoppingCartIcon className="h-4 w-4 text-current" />
                  </span>
                  {t(l.key)}
                </>
              )}
            </>
          ) : (
            t(l.key)
          )}
          {l.to === "/cart" && cartCount > 0 && !isMobile && (
            <span
              className="ml-auto rounded-full border border-[#00FF9A]/35 bg-[#00FF9A]/10 px-2 py-0.5 text-xs font-semibold text-[#00FF9A] shadow-[0_0_12px_rgba(0,255,154,0.18)]"
            >
              {cartCount}
            </span>
          )}
        </Link>
        ),
      )}
      {!isMobile && (
        <>
          <div className="my-1 border-t border-white/10" />
          {isLoggedIn ? (
            <button
              onClick={() => {
                setShowLogoutConfirm(true);
                closeMenu();
              }}
              className="flex w-full items-center justify-center px-4 py-3 text-center text-sm text-red-400 transition-colors hover:bg-white/5"
            >
              {t("auth.logout")}
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => closeMenu()}
              className="flex items-center justify-center px-4 py-3 text-center text-sm text-[#00FF9A] transition-colors hover:bg-white/5"
            >
              {t("auth.login")}
            </Link>
          )}
        </>
      )}
      {isMobile && (
        <>
          <div className="mx-3 mt-3 border-t border-white/10 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code, true)}
                  className={`rounded-[16px] border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                    i18n.language === lang.code
                      ? "border-[#00FF9A]/28 bg-[#00FF9A]/10 text-[#00FF9A]"
                      : "border-white/8 bg-white/[0.03] text-[#A6B3C9] hover:border-[#00FF9A]/22 hover:text-[#E7EDF7]"
                  }`}
                >
                  {t(lang.labelKey)}
                </button>
              ))}
            </div>
            <div className="mt-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    closeMenu();
                  }}
                  className="flex w-full items-center justify-center rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-red-400 transition-colors hover:border-red-400/20 hover:bg-red-500/[0.08]"
                >
                  {t("auth.logout")}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => closeMenu()}
                  className="flex items-center justify-center rounded-[16px] border border-[#00FF9A]/18 bg-[#00FF9A]/[0.07] px-4 py-3 text-center text-sm font-semibold text-[#00FF9A] transition-colors hover:border-[#00FF9A]/32 hover:bg-[#00FF9A]/10"
                >
                  {t("auth.login")}
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070A0F] text-[#E7EDF7]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/8 bg-[#070A0F]/84 shadow-[0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-xl">
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
              className="order-1 rounded-xl bg-[#00FF9A] px-3 py-2 text-sm font-semibold text-[#070A0F] sm:px-4"
            >
              {t("header.buyBtn")}
            </Link>

            <div
              className="relative order-2 hidden md:block"
              onMouseEnter={() => setDesktopLanguageOpen(true)}
              onMouseLeave={() => setDesktopLanguageOpen(false)}
            >
              <button
                type="button"
                className="flex h-12 min-w-[94px] items-center justify-between gap-2 rounded-[18px] border border-white/10 bg-white/5 px-3.5 text-sm font-semibold text-[#CFE6DA] transition-all hover:border-[#00FF9A]/34 hover:text-[#F3FFF9]"
                aria-haspopup="menu"
                aria-expanded={desktopLanguageOpen}
                aria-label={t(currentLanguage.labelKey)}
              >
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4.5 w-4.5 text-[#00FF9A] drop-shadow-[0_0_8px_rgba(0,255,154,0.3)]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm4.66-5.12a11.8 11.8 0 0 0-2.32-.8c.13-.65.2-1.34.2-2.08 0-.73-.07-1.42-.2-2.06.83-.2 1.61-.48 2.32-.82A6.46 6.46 0 0 1 16.5 10c0 1.08-.26 2.1-.72 2.88ZM10 16.5c-.78 0-1.73-1.23-2.18-3.32.7-.1 1.43-.18 2.18-.18s1.48.08 2.18.18C11.73 15.27 10.78 16.5 10 16.5Zm-3.82-3.62c-.13-.65-.2-1.34-.2-2.08 0-.73.07-1.42.2-2.06A15.8 15.8 0 0 0 10 9c1.31 0 2.58-.1 3.82-.26.13.64.2 1.33.2 2.06 0 .74-.07 1.43-.2 2.08A15.76 15.76 0 0 0 10 12.6c-1.31 0-2.58.1-3.82.28ZM3.5 10c0-1.08.26-2.1.72-2.88.71.34 1.49.62 2.32.82-.13.64-.2 1.33-.2 2.06 0 .74.07 1.43.2 2.08-.83.2-1.61.47-2.32.8A6.46 6.46 0 0 1 3.5 10Zm6.5-6.5c.78 0 1.73 1.23 2.18 3.32-.7.1-1.43.18-2.18.18s-1.48-.08-2.18-.18C8.27 4.73 9.22 3.5 10 3.5Zm-4.66 1.62c.71.34 1.49.62 2.32.82.32-1.34.82-2.45 1.45-3.18a6.53 6.53 0 0 0-3.77 2.36Zm5.55-2.36c.63.73 1.13 1.84 1.45 3.18.83-.2 1.61-.48 2.32-.82a6.53 6.53 0 0 0-3.77-2.36Zm-5.55 12.12a6.53 6.53 0 0 0 3.77 2.36c-.63-.73-1.13-1.84-1.45-3.18-.83.2-1.61.48-2.32.82Zm5.55 2.36a6.53 6.53 0 0 0 3.77-2.36c-.71-.34-1.49-.62-2.32-.82-.32 1.34-.82 2.45-1.45 3.18Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{currentLanguage.shortLabel}</span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-3.5 w-3.5 text-[#9AA7BD] transition-transform duration-200 ${
                    desktopLanguageOpen ? "rotate-180 text-[#E7EDF7]" : ""
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {desktopLanguageOpen && (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-36 overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1220] shadow-[0_16px_34px_rgba(0,0,0,0.34)]">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => changeLanguage(lang.code)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                          i18n.language === lang.code
                            ? "bg-[#00FF9A]/10 text-[#00FF9A]"
                            : "text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7]"
                        }`}
                      >
                        <span>{t(lang.labelKey)}</span>
                        <span className="text-xs font-semibold tracking-[0.08em] text-inherit">
                          {lang.shortLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <Link
                to="/cart"
                aria-label={t("header.cart")}
                title={t("header.cart")}
                className={`relative order-3 hidden items-center justify-center rounded-xl border border-[#00FF9A]/24 bg-[radial-gradient(circle_at_top,rgba(0,255,154,0.08),rgba(26,27,34,0.98)_74%)] p-2 text-[#00FF9A] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,255,154,0.05),0_12px_24px_rgba(0,0,0,0.22),0_0_18px_rgba(0,255,154,0.08)] transition-all hover:-translate-y-[1px] hover:border-[#00FF9A]/42 hover:text-[#8DFFC9] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,255,154,0.08),0_14px_28px_rgba(0,0,0,0.24),0_0_24px_rgba(0,255,154,0.14)] md:flex ${
                  cartPulseActive
                    ? "scale-[1.08] border-[#00FF9A]/44 text-[#8DFFC9] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,255,154,0.08),0_14px_30px_rgba(0,0,0,0.25),0_0_28px_rgba(0,255,154,0.22)]"
                    : ""
                }`}
              >
                <span className="pointer-events-none absolute inset-[4px] rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />
                <ShoppingCartIcon className="relative h-5 w-5 drop-shadow-[0_0_10px_rgba(0,255,154,0.46)]" />
                {cartCount > 0 && (
                  <span
                    className={`absolute -top-2 -right-2 min-w-[20px] rounded-full border border-[#00FF9A]/30 bg-[#00FF9A] px-1.5 py-0.5 text-center text-[11px] font-bold text-[#070A0F] shadow-[0_0_14px_rgba(0,255,154,0.35)] transition-transform duration-300 ${
                      cartPulseActive ? "scale-110" : ""
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <div
              className="relative order-2 md:order-4"
              ref={menuRef}
              onMouseEnter={() => setDesktopMenuOpen(true)}
              onMouseLeave={() => setDesktopMenuOpen(false)}
            >
              {/* Desktop hamburger */}
              <button
                type="button"
                className={`hidden md:flex items-center justify-center rounded-xl border bg-white/5 p-2 text-[#9AA7BD] transition-colors ${
                  isLoggedIn
                    ? "border-[#00FF9A]/22 text-[#C9F9E0] hover:border-[#00FF9A]/38 hover:text-[#E7EDF7]"
                    : "border-white/10 hover:border-[#00FF9A]/30 hover:text-[#E7EDF7]"
                }`}
                aria-haspopup="menu"
                aria-expanded={desktopMenuOpen}
              >
                <ProfileMenuIcon open={desktopMenuOpen} loggedIn={isLoggedIn} />
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={toggleMenu}
                className={`relative flex md:hidden items-center justify-center rounded-xl border bg-white/5 p-2 transition-all ${
                  isLoggedIn
                    ? "border-[#00FF9A]/22 text-[#C9F9E0] hover:border-[#00FF9A]/38 hover:text-[#E7EDF7]"
                    : "border-white/10 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7]"
                } ${
                  cartPulseActive && isLoggedIn
                    ? "scale-[1.05] border-[#00FF9A]/38 shadow-[0_0_24px_rgba(0,255,154,0.16)]"
                    : ""
                }`}
              >
                <ProfileMenuIcon open={menuOpen} loggedIn={isLoggedIn} />
                {cartCount > 0 && (
                  <span
                    className={`absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full border border-[#00FF9A]/35 bg-[#00FF9A] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-[#070A0F] shadow-[0_0_14px_rgba(0,255,154,0.35)] transition-transform duration-300 ${
                      cartPulseActive ? "scale-110" : ""
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
              {desktopMenuOpen && (
                <div className="absolute right-0 top-full z-50 hidden pt-2 md:block">
                  <div className="w-56 overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30 menu-panel menu-panel-open">
                    {renderMenuContent(false)}
                  </div>
                </div>
              )}
              {menuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30 z-50 md:hidden ${menuPanelClass}`}
                >
                  {/* Mobile menu */}
                  <div className="md:hidden">{renderMenuContent(true)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-[76px] sm:pt-[82px]">

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
        <Route path="/cart" element={<Cart />} />
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
      <CustomerService />
      </div>
    </div>
  );
}
