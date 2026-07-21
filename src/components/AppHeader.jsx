import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../utils/languages.js";
import { getCartCount } from "../api/cart";
import { getStoredPlayerToken } from "../utils/playerAuth.js";
import { safeSetItem } from "../utils/safeStorage.js";

const ACCOUNT_LINKS = [
  { to: "/cart", key: "header.cart" },
  { to: "/orders", key: "header.checkout" },
  { to: "/account/privacy", key: "header.privacyCenter" },
];

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
      <path d="M7.12 6.35a.9.9 0 0 0-.86-.65H4.95a.9.9 0 1 0 0 1.8h.65l1.34 5.22a1.65 1.65 0 0 0 1.6 1.24h7.07a1.66 1.66 0 0 0 1.58-1.16l1.02-3.2a1.18 1.18 0 0 0-1.12-1.54H8.3l-.26-1.05a.9.9 0 0 0-.92-.66Zm1.62 9.98a1.28 1.28 0 1 0 0 2.56 1.28 1.28 0 0 0 0-2.56Zm6.86 0a1.28 1.28 0 1 0 0 2.56 1.28 1.28 0 0 0 0-2.56Z" />
    </svg>
  );
}

function OrdersIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 4.5h11l3 3v12H5z" />
      <path d="M5 9h14" />
      <path d="M9 13h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function GlobeIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm4.66-5.12a11.8 11.8 0 0 0-2.32-.8c.13-.65.2-1.34.2-2.08 0-.73-.07-1.42-.2-2.06.83-.2 1.61-.48 2.32-.82A6.46 6.46 0 0 1 16.5 10c0 1.08-.26 2.1-.72 2.88ZM10 16.5c-.78 0-1.73-1.23-2.18-3.32.7-.1 1.43-.18 2.18-.18s1.48.08 2.18.18C11.73 15.27 10.78 16.5 10 16.5Zm-3.82-3.62c-.13-.65-.2-1.34-.2-2.08 0-.73.07-1.42.2-2.06A15.8 15.8 0 0 0 10 9c1.31 0 2.58-.1 3.82-.26.13.64.2 1.33.2 2.06 0 .74-.07 1.43-.2 2.08A15.76 15.76 0 0 0 10 12.6c-1.31 0-2.58.1-3.82.28ZM3.5 10c0-1.08.26-2.1.72-2.88.71.34 1.49.62 2.32.82-.13.64-.2 1.33-.2 2.06 0 .74.07 1.43.2 2.08-.83.2-1.61.47-2.32.8A6.46 6.46 0 0 1 3.5 10Zm6.5-6.5c.78 0 1.73 1.23 2.18 3.32-.7.1-1.43.18-2.18.18s-1.48-.08-2.18-.18C8.27 4.73 9.22 3.5 10 3.5Zm-4.66 1.62c.71.34 1.49.62 2.32.82.32-1.34.82-2.45 1.45-3.18a6.53 6.53 0 0 0-3.77 2.36Zm5.55-2.36c.63.73 1.13 1.84 1.45 3.18.83-.2 1.61-.48 2.32-.82a6.53 6.53 0 0 0-3.77-2.36Zm-5.55 12.12a6.53 6.53 0 0 0 3.77 2.36c-.63-.73-1.13-1.84-1.45-3.18-.83.2-1.61.48-2.32.82Zm5.55 2.36a6.53 6.53 0 0 0 3.77-2.36c-.71-.34-1.49-.62-2.32-.82-.32 1.34-.82 2.45-1.45 3.18Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AppHeader({ isLoggedIn, playerDisplayName, onRequestLogout }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isHomePage = location.pathname === "/home" || location.pathname === "/";

  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [desktopLanguageOpen, setDesktopLanguageOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartPulseActive, setCartPulseActive] = useState(false);
  // 接收 Home 广播的 Header CTA 强度(0=隐藏,1=完全显示)。
  // 仅首页时使用此值,非首页时 CTA 默认 progress=1 持续显示。
  const [homeHeaderCtaProgress, setHomeHeaderCtaProgress] = useState(0);

  const menuRef = useRef(null);
  const langRef = useRef(null);
  const cartPulseTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = (event) => {
      const next = event?.detail?.progress;
      if (typeof next === "number") setHomeHeaderCtaProgress(next);
    };
    window.addEventListener("home-header-cta-progress", handler);
    return () =>
      window.removeEventListener("home-header-cta-progress", handler);
  }, []);

  // 非首页:CTA 始终全显(progress 固定为 1)
  // 首页:跟随滚动进度
  const ctaProgress = isHomePage ? homeHeaderCtaProgress : 1;
  const shouldRenderCta = !isHomePage || ctaProgress > 0.04;

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

  const changeLanguage = useCallback(
    (langCode, closeAfterChange = false) => {
      i18n.changeLanguage(langCode);
      safeSetItem("language", langCode);
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

  const menuPanelClass = isClosing
    ? "menu-panel menu-panel-closing"
    : "menu-panel menu-panel-open";

  const renderMobileMenu = () => (
    <>
      {isLoggedIn && playerDisplayName && (
        <div className="mx-3 mb-2 mt-3 rounded-[22px] border border-[#00FF9A]/18 bg-[radial-gradient(circle_at_top,rgba(0,255,154,0.14),rgba(11,18,32,0.95)_72%)] px-4 py-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#7BFFCA]/40 bg-[radial-gradient(circle_at_30%_30%,rgba(217,255,237,0.9),rgba(0,255,154,0.28)_45%,rgba(4,17,24,0.96)_100%)]">
            <span className="bg-[linear-gradient(180deg,#F5FFF9_0%,#B8FFD9_100%)] bg-clip-text text-[18px] font-black tracking-[0.16em] text-transparent">
              {playerDisplayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="truncate bg-[linear-gradient(135deg,#F4FFF9_0%,#B9FFD8_48%,#39F1A2_100%)] bg-clip-text text-[15px] font-black tracking-[0.08em] text-transparent">
            {playerDisplayName}
          </div>
        </div>
      )}
      {ACCOUNT_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={() => closeMenu()}
          className={
            "mx-3 flex min-h-[46px] items-center justify-center border-t border-white/8 px-4 text-center text-sm transition-colors first:border-t-0 hover:bg-white/5 " +
            (l.to === "/cart"
              ? "text-[#00FF9A] hover:text-[#8DFFC9]"
              : "text-[#DCE6F4] hover:text-[#E7EDF7]")
          }
        >
          {l.to === "/cart" ? (
            <span className="flex items-center justify-center gap-2">
              <span>{t(l.key)}</span>
              {cartCount > 0 && (
                <span className="min-w-[18px] rounded-full border border-[#00FF9A]/28 bg-[#00FF9A]/10 px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#00FF9A]">
                  {cartCount}
                </span>
              )}
            </span>
          ) : (
            t(l.key)
          )}
        </Link>
      ))}
      <div className="mx-3 mt-3 border-t border-white/10 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code, true)}
              className={`rounded-[16px] border px-3 py-2.5 text-sm font-semibold transition-colors ${
                i18n.language === lang.code
                  ? "border-[#00FF9A]/30 bg-[#00FF9A]/10 text-[#00FF9A]"
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
                onRequestLogout();
                closeMenu();
              }}
              className="flex w-full items-center justify-center rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:border-red-400/20 hover:bg-red-500/[0.08]"
            >
              {t("auth.logout")}
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => closeMenu()}
              className="flex items-center justify-center rounded-[16px] border border-[#00FF9A]/18 bg-[#00FF9A]/[0.07] px-4 py-3 text-sm font-semibold text-[#00FF9A] transition-colors hover:border-[#00FF9A]/32 hover:bg-[#00FF9A]/10"
            >
              {t("auth.login")}
            </Link>
          )}
        </div>
      </div>
    </>
  );

  const renderDesktopMenu = () => (
    <>
      {isLoggedIn && playerDisplayName && (
        <>
          <div className="mx-2 mb-2 mt-3 cursor-default select-none rounded-[22px] border border-[#00FF9A]/18 bg-[radial-gradient(circle_at_top,rgba(0,255,154,0.14),rgba(11,18,32,0.95)_72%)] px-4 py-4 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#7BFFCA]/40 bg-[radial-gradient(circle_at_30%_30%,rgba(217,255,237,0.9),rgba(0,255,154,0.28)_45%,rgba(4,17,24,0.96)_100%)]">
              <span className="bg-[linear-gradient(180deg,#F5FFF9_0%,#B8FFD9_100%)] bg-clip-text text-[17px] font-black tracking-[0.16em] text-transparent">
                {playerDisplayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="truncate bg-[linear-gradient(135deg,#F4FFF9_0%,#B9FFD8_48%,#39F1A2_100%)] bg-clip-text text-[15px] font-black tracking-[0.08em] text-transparent">
              {playerDisplayName}
            </div>
          </div>
          <div className="my-1 border-t border-white/10" />
        </>
      )}
      <Link
        to="/orders"
        onClick={() => closeMenu()}
        className="flex items-center justify-center px-4 py-3 text-center text-sm text-[#9AA7BD] transition-colors hover:bg-white/5 hover:text-[#E7EDF7]"
      >
        {t("header.checkout")}
      </Link>
      {isLoggedIn ? (
        <Link
          to="/account/privacy"
          onClick={() => closeMenu()}
          className="flex items-center justify-center px-4 py-3 text-center text-sm text-[#9AA7BD] transition-colors hover:bg-white/5 hover:text-[#E7EDF7]"
        >
          {t("header.privacyCenter")}
        </Link>
      ) : null}
      <div className="my-1 border-t border-white/10" />
      {isLoggedIn ? (
        <button
          onClick={() => {
            onRequestLogout();
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
  );

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-30 transition-colors duration-300 " +
        (isHomePage
          ? "border-b border-transparent bg-[#070A0F]/72 backdrop-blur-xl"
          : "border-b border-white/8 bg-[#070A0F]/82 shadow-[0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-xl")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/home" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#00FF9A]/25 bg-[#0B1220]">
            <span className="text-sm font-bold text-[#00FF9A]">V</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">
              {t("header.brand")}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {shouldRenderCta && (
            <Link
              to="/fc26-coins"
              aria-label={t("home.cta")}
              style={{
                opacity: ctaProgress,
                transform: `translateY(${(1 - ctaProgress) * 8}px) scale(${0.78 + ctaProgress * 0.22})`,
                pointerEvents: ctaProgress < 0.3 ? "none" : "auto",
                willChange: "opacity, transform",
              }}
              className="app-header-cta cta-primary inline-flex h-10 shrink-0 items-center gap-1.5 px-3.5 text-sm"
            >
              <span className="hidden sm:inline">{t("home.cta")}</span>
              <span className="sm:hidden">{t("home.ctaShort")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M3.75 10a.75.75 0 0 1 .75-.75h9.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H4.5A.75.75 0 0 1 3.75 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          )}
          <div
            className="relative hidden md:block"
            ref={langRef}
            onMouseEnter={() => setDesktopLanguageOpen(true)}
            onMouseLeave={() => setDesktopLanguageOpen(false)}
          >
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-[#CFE6DA] transition-all hover:border-[#00FF9A]/32 hover:text-[#F3FFF9]"
              aria-haspopup="menu"
              aria-expanded={desktopLanguageOpen}
              aria-label={t(currentLanguage.labelKey)}
            >
              <GlobeIcon className="h-4 w-4 text-[#00FF9A]" />
              <span>{currentLanguage.shortLabel}</span>
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
                <div className="w-36 overflow-hidden rounded-[20px] border border-white/10 bg-[#0B1220] shadow-[0_16px_34px_rgba(0,0,0,0.34)]">
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

          {/* 移动端独立语言切换按钮 — 仅未登录时显示
              已登录用户的语言切换仍在抽屉内,无需暴露;
              未登录用户原本依赖抽屉切换,现轮廓按钮已替换为 Log in 胶囊,
              故此处暴露 globe 单击 toggle 下一种语言(LANGUAGES 当前 2 项 = 直接 ZH ⇄ EN) */}
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                const idx = LANGUAGES.findIndex(
                  (l) => l.code === i18n.language,
                );
                const next =
                  LANGUAGES[(idx + 1 + LANGUAGES.length) % LANGUAGES.length];
                changeLanguage(next.code, true);
              }}
              className="flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-[#CFE6DA] transition-all hover:border-[#00FF9A]/32 hover:text-[#F3FFF9] md:hidden"
              aria-label={t(currentLanguage.labelKey)}
              title={t(currentLanguage.labelKey)}
            >
              <GlobeIcon className="h-4 w-4 text-[#00FF9A]" />
              <span>{currentLanguage.shortLabel}</span>
            </button>
          )}

          {isLoggedIn && (
            <Link
              to="/orders"
              aria-label={t("header.checkout")}
              title={t("header.checkout")}
              className={`hidden h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-all md:inline-flex ${
                isHomePage
                  ? "border-white/8 bg-white/[0.03] text-[#9AA7BD] hover:border-[#00FF9A]/26 hover:text-[#00FF9A]"
                  : "border-[#00FF9A]/22 bg-[#00FF9A]/[0.04] text-[#7BFFCA] hover:border-[#00FF9A]/38 hover:text-[#8DFFC9]"
              }`}
            >
              <OrdersIcon className="h-4 w-4" />
              <span>{t("header.checkout")}</span>
            </Link>
          )}

          {isLoggedIn && (
            <Link
              to="/cart"
              aria-label={t("header.cart")}
              title={t("header.cart")}
              className={`relative hidden h-10 w-10 items-center justify-center rounded-full border text-[#9AA7BD] transition-all md:flex ${
                isHomePage
                  ? "border-white/8 bg-white/[0.03] hover:border-[#00FF9A]/26 hover:text-[#00FF9A]"
                  : "border-[#00FF9A]/22 bg-[#00FF9A]/[0.04] text-[#7BFFCA] hover:border-[#00FF9A]/38 hover:text-[#8DFFC9]"
              } ${
                cartPulseActive
                  ? "scale-[1.08] border-[#00FF9A]/40 text-[#8DFFC9] shadow-[0_0_24px_rgba(0,255,154,0.22)]"
                  : ""
              }`}
            >
              <ShoppingCartIcon className="h-4 w-4" />
              {cartCount > 0 && (
                <span
                  className={`absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full border border-[#00FF9A]/30 bg-[#00FF9A] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-[#070A0F] shadow-[0_0_12px_rgba(0,255,154,0.32)] transition-transform ${
                    cartPulseActive ? "scale-110" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <div
            className="relative"
            ref={menuRef}
            onMouseEnter={() => isLoggedIn && setDesktopMenuOpen(true)}
            onMouseLeave={() => isLoggedIn && setDesktopMenuOpen(false)}
          >
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#00FF9A]/22 bg-white/[0.04] text-[#C9F9E0] transition-colors hover:border-[#00FF9A]/38 hover:text-[#E7EDF7] md:flex"
                  aria-haspopup="menu"
                  aria-expanded={desktopMenuOpen}
                >
                  <ProfileMenuIcon open={desktopMenuOpen} loggedIn={isLoggedIn} />
                </button>
                <button
                  onClick={toggleMenu}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-[#00FF9A]/22 bg-white/[0.04] text-[#C9F9E0] transition-all md:hidden ${
                    cartPulseActive
                      ? "scale-[1.05] border-[#00FF9A]/38 shadow-[0_0_24px_rgba(0,255,154,0.16)]"
                      : ""
                  }`}
                  aria-label="menu"
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
                    <div className="menu-panel menu-panel-open w-56 overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30">
                      {renderDesktopMenu()}
                    </div>
                  </div>
                )}
                {menuOpen && (
                  <div
                    className={`absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30 md:hidden ${menuPanelClass}`}
                  >
                    <div className="md:hidden">{renderMobileMenu()}</div>
                  </div>
                )}
              </>
            ) : (
              // 未登录:直接渲染「Log in」描边胶囊,无下拉、无抽屉 — 与 Apple / GitHub / Stripe 同源
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-full border border-[#00FF9A]/22 bg-[#00FF9A]/[0.04] px-3.5 text-sm font-semibold text-[#7BFFCA] transition-all hover:border-[#00FF9A]/38 hover:text-[#8DFFC9]"
                aria-label={t("auth.login")}
              >
                {t("auth.login")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
