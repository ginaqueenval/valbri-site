import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import { playerRegister } from "../api/auth";
import { getPublishedPolicies } from "../api/legal.js";
import { resolvePublishedPolicy } from "../legal/policyClient.js";
import PlayerAuthLayout from "../components/PlayerAuthLayout.jsx";
import useCaptcha from "../hooks/useCaptcha.js";

const policyReference = (policy) => ({
  policyId: policy.id,
  policyType: policy.policyType,
  locale: policy.locale,
  version: policy.version,
  contentSha256: policy.contentSha256,
});

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    captchaCode, setCaptchaCode, captchaUuid, captchaUrl, captchaEnabled, loadCaptcha,
  } = useCaptcha();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [publishedPolicies, setPublishedPolicies] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPublishedPolicies = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const response = await getPublishedPolicies();
      const policies = Array.isArray(response.data) ? response.data : [];
      const [termsPolicy, privacyPolicy] = await Promise.all([
        resolvePublishedPolicy("terms", policies.find((policy) => policy.policyType === "terms")),
        resolvePublishedPolicy("privacy", policies.find((policy) => policy.policyType === "privacy")),
      ]);
      if (!termsPolicy || !privacyPolicy) {
        throw new Error(t("auth.policyUnavailable"));
      }
      setPublishedPolicies({ termsPolicy, privacyPolicy });
    } catch (err) {
      setPublishedPolicies(null);
      setError(err?.response?.data?.msg || err?.message || t("auth.policyUnavailable"));
    } finally {
      setPolicyLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPublishedPolicies();
  }, [loadPublishedPolicies]);

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
    if (!acceptTerms || !ageConfirmed) {
      setError(t("auth.acceptTermsRequired"));
      return;
    }
    if (!publishedPolicies) {
      setError(t("auth.policyUnavailable"));
      return;
    }

    setLoading(true);

    try {
      await playerRegister({
        username,
        password,
        email,
        ageConfirmed,
        termsPolicy: policyReference(publishedPolicies.termsPolicy),
        privacyPolicy: policyReference(publishedPolicies.privacyPolicy),
        code: captchaCode.trim(),
        uuid: captchaUuid,
      });
      navigate("/login", { state: { message: t("auth.registerSuccess") } });
    } catch (err) {
      if (err?.response?.data?.errorKey === "POLICY_VERSION_STALE") {
        setAcceptTerms(false);
        setAgeConfirmed(false);
        await loadPublishedPolicies();
      }
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
              autoComplete="username"
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
              autoComplete="email"
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
              autoComplete="new-password"
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
              autoComplete="new-password"
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
                  autoComplete="off"
                  inputMode="text"
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

          <label className="player-auth-terms">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              aria-label={t("auth.acceptTermsAria")}
            />
            <span>
              <Trans
                i18nKey="auth.acceptTerms"
                components={{
                  terms: (
                    <Link to="/terms" target="_blank" rel="noopener noreferrer" />
                  ),
                  privacy: (
                    <Link to="/privacy" target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              />
            </span>
          </label>

          <label className="player-auth-terms">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              aria-label={t("auth.ageConfirmationAria")}
            />
            <span>{t("auth.ageConfirmation")}</span>
          </label>

          <button
            type="submit"
            disabled={loading || policyLoading || !acceptTerms || !ageConfirmed}
            className="player-auth-submit"
          >
            {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
          </button>
        </form>
    </PlayerAuthLayout>
  );
}
