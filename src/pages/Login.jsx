import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPlayerCaptcha, playerLogin } from "../api/auth";
import PlayerAuthLayout from "../components/PlayerAuthLayout.jsx";
import { setStoredPlayerSession } from "../utils/playerAuth.js";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaUuid, setCaptchaUuid] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const successMessage =
    typeof location.state?.message === "string" ? location.state.message : "";

  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const res = await getPlayerCaptcha();
      const enabled = res.captchaEnabled !== false;
      setCaptchaEnabled(enabled);
      if (enabled) {
        setCaptchaUrl(`data:image/jpeg;base64,${res.img}`);
        setCaptchaUuid(res.uuid || "");
      } else {
        setCaptchaUrl("");
        setCaptchaUuid("");
      }
      setCaptchaCode("");
    } catch {
      setCaptchaEnabled(false);
      setCaptchaUrl("");
      setCaptchaUuid("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (captchaEnabled && !captchaCode.trim()) {
      setError(t("auth.captchaRequired"));
      return;
    }

    setLoading(true);

    try {
      const res = await playerLogin({
        username,
        password,
        code: captchaCode.trim(),
        uuid: captchaUuid,
      });
      setStoredPlayerSession(
        { token: res.token, player: res.player },
        { reason: "login" },
      );
      navigate(location.state?.redirectTo || "/home");
    } catch (err) {
      setError(
        err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          t("auth.loginFailed"),
      );
      if (captchaEnabled) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlayerAuthLayout
      mode="login"
      footer={
        <p className="player-auth-foot">
          {t("auth.noAccount")}{" "}
          <Link to="/register">{t("auth.signUp")}</Link>
        </p>
      }
    >
        <form onSubmit={handleSubmit} className="player-auth-form">
          {successMessage ? (
            <div className="player-auth-alert player-auth-alert-success">
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="player-auth-alert player-auth-alert-error">
              {error}
            </div>
          ) : null}

          <div className="player-auth-field">
            <label>
              {t("auth.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={t("auth.username")}
            />
          </div>

          <div className="player-auth-field">
            <label>
              {t("auth.password")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t("auth.password")}
            />
            <button
              type="button"
              className="player-auth-eye"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? "◌" : "◉"}
            </button>
          </div>

          {captchaEnabled ? (
            <div className="player-auth-captcha-grid">
              <div className="player-auth-field">
                <label>
                  {t("auth.captcha")}
                </label>
                <input
                  type="text"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value)}
                  required={captchaEnabled}
                  placeholder={t("auth.captchaPlaceholder")}
                />
              </div>

              <button
                type="button"
                onClick={loadCaptcha}
                className="player-auth-captcha"
                aria-label={t("auth.refreshCaptcha")}
              >
                {captchaUrl ? (
                  <span className="player-auth-captcha-image">
                    <img
                      src={captchaUrl}
                      alt={t("auth.captcha")}
                    />
                  </span>
                ) : (
                  <span>
                    {t("auth.refreshCaptcha")}
                  </span>
                )}
              </button>
            </div>
          ) : null}

          <label className="player-auth-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            {t("auth.rememberMe")}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="player-auth-submit"
          >
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>
    </PlayerAuthLayout>
  );
}
