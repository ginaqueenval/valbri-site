import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPlayerCaptcha, playerRegister } from "../api/auth";
import PlayerAuthLayout from "../components/PlayerAuthLayout.jsx";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaUuid, setCaptchaUuid] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (username.length < 3) {
      setError(t("auth.usernameTooShort"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (captchaEnabled && !captchaCode.trim()) {
      setError(t("auth.captchaRequired"));
      return;
    }

    setLoading(true);

    try {
      await playerRegister({
        username,
        password,
        email,
        code: captchaCode.trim(),
        uuid: captchaUuid,
      });
      navigate("/login", { state: { message: t("auth.registerSuccess") } });
    } catch (err) {
      setError(
        err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          t("auth.registerFailed"),
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
      mode="register"
      footer={
        <p className="player-auth-foot">
          {t("auth.hasAccount")} <Link to="/login">{t("auth.signIn")}</Link>
        </p>
      }
    >
        <form onSubmit={handleSubmit} className="player-auth-form">
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
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t("auth.email")}
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

          <div className="player-auth-field">
            <label>
              {t("auth.confirmPassword")}
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t("auth.confirmPassword")}
            />
            <button
              type="button"
              className="player-auth-eye"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={
                showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")
              }
            >
              {showConfirmPassword ? "◌" : "◉"}
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

          <button
            type="submit"
            disabled={loading}
            className="player-auth-submit"
          >
            {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
          </button>
        </form>
    </PlayerAuthLayout>
  );
}
