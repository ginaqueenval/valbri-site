import { lazy, Suspense, useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CustomerService from "./components/CustomerService.jsx";
import AppHeader from "./components/AppHeader.jsx";
import LogoutConfirmModal from "./components/LogoutConfirmModal.jsx";
import SessionExpiredModal from "./components/SessionExpiredModal.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Fc26 = lazy(() => import("./pages/Fc26.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.jsx"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel.jsx"));
const MockPayment = lazy(() => import("./pages/MockPayment.jsx"));
import { getPlayerDisplayName } from "./utils/playerProfile.js";
import {
  clearStoredPlayerSession,
  getStoredPlayerSession,
  PLAYER_AUTH_CHANGED_EVENT,
  PLAYER_SESSION_EXPIRED_EVENT,
} from "./utils/playerAuth.js";

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
  const isLoggedIn = !!authSession.token;
  const playerDisplayName = getPlayerDisplayName(authSession.player);

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
    const handler = () => {
      setShowSessionExpired(true);
    };
    window.addEventListener(PLAYER_SESSION_EXPIRED_EVENT, handler);
    return () =>
      window.removeEventListener(PLAYER_SESSION_EXPIRED_EVENT, handler);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#070A0F] text-[#E7EDF7]">
        <AppHeader
          isLoggedIn={isLoggedIn}
          playerDisplayName={playerDisplayName}
          onRequestLogout={() => setShowLogoutConfirm(true)}
        />

        <div className="w-full max-w-[100vw] overflow-x-hidden pt-[76px] sm:pt-[82px]">

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
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/mock-payment/:provider" element={<MockPayment />} />
            </Route>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>

        <footer className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-[#9AA7BD]">
            <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
            <div className="flex gap-4">
              <Link to="/reviews" className="hover:text-[#E7EDF7]">
                {t("reviews.pageTitle")}
              </Link>
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
    </ErrorBoundary>
  );
}
