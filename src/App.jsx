import { lazy, Suspense, useCallback, useRef, useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CustomerService from "./components/CustomerService.jsx";
import AppHeader from "./components/AppHeader.jsx";
import LogoutConfirmModal from "./components/LogoutConfirmModal.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import SessionExpiredModal from "./components/SessionExpiredModal.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import LegalPolicyPage from "./components/LegalPolicyPage.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Fc26 = lazy(() => import("./pages/Fc26.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Cookies = lazy(() => import("./pages/Cookies.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));
const PrivacyRequests = lazy(() => import("./pages/PrivacyRequests.jsx"));
const RefundRequests = lazy(() => import("./pages/RefundRequests.jsx"));
const UnauthorizedRefundClaim = lazy(() => import("./pages/UnauthorizedRefundClaim.jsx"));
const AccountPrivacy = lazy(() => import("./pages/AccountPrivacy.jsx"));
const MarketingUnsubscribe = lazy(() => import("./pages/MarketingUnsubscribe.jsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.jsx"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel.jsx"));
const MockPayment = lazy(() => import("./pages/MockPayment.jsx"));
const BackupCodesGuide = lazy(() => import("./pages/BackupCodesGuide.jsx"));
import { getPlayerDisplayName } from "./utils/playerProfile.js";
import {
  clearStoredPlayerSession,
  getStoredPlayerSession,
  PLAYER_AUTH_CHANGED_EVENT,
  PLAYER_SESSION_EXPIRED_EVENT,
} from "./utils/playerAuth.js";
import {
  getPrivacyPreferences,
  updatePrivacyPreferences,
} from "./api/privacyPreferences.js";
import {
  CONSENT_CHANGED_EVENT,
  isGlobalPrivacyControlEnabled,
  notifyConsentSyncStatus,
  openCookieSettings,
  readConsentRecord,
  saveConsentChoices,
} from "./utils/consentStorage.js";
import {
  saveExplicitConsentToAccount,
  synchronizeConsentOnLogin,
} from "./utils/consentSync.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [authSession, setAuthSession] = useState(() => getStoredPlayerSession());
  const consentSyncQueueRef = useRef(Promise.resolve());
  const isLoggedIn = !!authSession.token;
  const playerDisplayName = getPlayerDisplayName(authSession.player);
  // /guide/* 子路由为「完全无 chrome」教学页 — 隐藏 AppHeader / Footer / CustomerService,
  // 并取消顶部 76/82px 占位,让页面以纯净姿态呈现于新浏览器 tab
  const isChromelessRoute = location.pathname.startsWith("/guide");

  const saveSyncedConsentLocally = useCallback((preference) => {
    return saveConsentChoices(
      {
        preferences: preference.preferences,
        functional: preference.functional,
      },
      { notify: false },
    );
  }, []);

  const loadAccountPreference = useCallback(async () => {
    const response = await getPrivacyPreferences();
    return response.data || {};
  }, []);

  const saveAccountPreference = useCallback(async (payload) => {
    const response = await updatePrivacyPreferences(payload);
    return response.data || {};
  }, []);

  const syncExplicitConsent = useCallback(
    (localRecord) =>
      saveExplicitConsentToAccount({
        localRecord: { ...localRecord, explicitChoice: true },
        gpc: isGlobalPrivacyControlEnabled(),
        loadServer: loadAccountPreference,
        saveServer: saveAccountPreference,
        saveLocal: saveSyncedConsentLocally,
      }),
    [loadAccountPreference, saveAccountPreference, saveSyncedConsentLocally],
  );

  const handleLogout = () => {
    clearStoredPlayerSession({ reason: "logout" });
    setShowLogoutConfirm(false);
    navigate("/home");
  };

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
    if (!isLoggedIn) return undefined;
    let active = true;
    const localRecord = readConsentRecord();
    synchronizeConsentOnLogin({
      localRecord: localRecord ? { ...localRecord, explicitChoice: true } : null,
      gpc: isGlobalPrivacyControlEnabled(),
      loadServer: loadAccountPreference,
      saveServer: saveAccountPreference,
      saveLocal: (preference) => {
        if (active) saveSyncedConsentLocally(preference);
      },
    }).catch(() => {
      // Login sync waits for a later explicit choice instead of retrying automatically.
    });
    return () => {
      active = false;
    };
  }, [
    authSession.token,
    isLoggedIn,
    loadAccountPreference,
    saveAccountPreference,
    saveSyncedConsentLocally,
  ]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const syncChangedConsent = (event) => {
      const localRecord = event?.detail;
      if (!localRecord) return;
      consentSyncQueueRef.current = consentSyncQueueRef.current
        .then(() => syncExplicitConsent(localRecord))
        .then((result) => {
          if (!result.requiresReconfirm) return;
          notifyConsentSyncStatus({ type: "conflict" });
          openCookieSettings();
        })
        .catch((syncError) => {
          notifyConsentSyncStatus({
            type: "error",
            message:
              syncError?.response?.data?.msg ||
              syncError?.message ||
              t("cookieConsent.syncFailed"),
          });
          openCookieSettings();
        });
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, syncChangedConsent);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, syncChangedConsent);
  }, [isLoggedIn, syncExplicitConsent, t]);

  useEffect(() => {
    const handler = () => {
      setShowSessionExpired(true);
    };
    window.addEventListener(PLAYER_SESSION_EXPIRED_EVENT, handler);
    return () =>
      window.removeEventListener(PLAYER_SESSION_EXPIRED_EVENT, handler);
  }, []);

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#070A0F] text-[#E7EDF7]">
      {!isChromelessRoute && (
        <AppHeader
          isLoggedIn={isLoggedIn}
          playerDisplayName={playerDisplayName}
          onRequestLogout={() => setShowLogoutConfirm(true)}
        />
      )}

      <div
        className={`flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden ${
          isChromelessRoute ? "" : "pt-[76px] sm:pt-[82px]"
        }`}
      >

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {showSessionExpired && (
        <SessionExpiredModal
          onDismiss={() => setShowSessionExpired(false)}
        />
      )}

      <ScrollToTop />

      {location.pathname !== "/home" && !isChromelessRoute && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7]"
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

      <div className="flex-1">
      <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00FF9A] border-t-transparent" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/fc26-coins" element={<Fc26 />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/marketing/unsubscribe/:token" element={<MarketingUnsubscribe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/privacy-requests" element={<PrivacyRequests />} />
            <Route path="/refund-requests" element={<RefundRequests />} />
            <Route path="/account/privacy" element={<AccountPrivacy />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/mock-payment/:provider" element={<MockPayment />} />
          </Route>
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/refund" element={<LegalPolicyPage type="refund" />} />
          <Route path="/refund/unauthorized" element={<UnauthorizedRefundClaim />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/guide/backup-codes" element={<BackupCodesGuide />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
      </div>

      {!isChromelessRoute && (
        <footer className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 text-sm text-[#9AA7BD] md:flex-row md:items-start">
            <div className="flex flex-col gap-1 md:w-[380px] md:shrink-0">
              <div className="md:whitespace-nowrap">{t("footer.tradingName")}</div>
              <div className="text-xs text-[#7F8CA3]">{t("footer.copyright")}</div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 md:min-w-0 md:flex-1 md:justify-end">
              <Link to="/reviews" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("reviews.pageTitle")}
              </Link>
              <Link to="/terms" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.terms")}
              </Link>
              <Link to="/privacy" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.privacy")}
              </Link>
              <Link to="/refund" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.refundPolicy")}
              </Link>
              <Link to="/privacy-requests" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.privacyRequests")}
              </Link>
              <Link to="/refund-requests" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.refundRequests")}
              </Link>
              <Link to="/refund/unauthorized" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.unauthorizedRefund")}
              </Link>
              <Link to="/cookies" className="inline-flex min-h-11 items-center hover:text-[#E7EDF7]">
                {t("footer.cookies")}
              </Link>
            </div>
          </div>
        </footer>
      )}
      {!isChromelessRoute && <CustomerService />}
      </div>
      <CookieConsent />
    </div>
  );
}
