import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPlayerCaptcha, playerRegister } from "../api/auth";

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
    } catch (err) {
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
          "Registration failed",
      );
      if (captchaEnabled) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-8">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-11 w-11 rounded-xl border border-[#00FF9A]/25 bg-[#0B1220] grid place-items-center">
            <span className="text-base font-semibold text-[#00FF9A]">V</span>
          </div>
          <h1 className="text-xl font-semibold text-[#E7EDF7]">
            {t("auth.registerTitle")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-[#9AA7BD]">
              {t("auth.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-[#E7EDF7] placeholder-[#9AA7BD]/50 focus:border-[#00FF9A]/40 focus:outline-none"
              placeholder={t("auth.username")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#9AA7BD]">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-[#E7EDF7] placeholder-[#9AA7BD]/50 focus:border-[#00FF9A]/40 focus:outline-none"
              placeholder={t("auth.email")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#9AA7BD]">
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-[#E7EDF7] placeholder-[#9AA7BD]/50 focus:border-[#00FF9A]/40 focus:outline-none"
              placeholder={t("auth.password")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#9AA7BD]">
              {t("auth.confirmPassword")}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-[#E7EDF7] placeholder-[#9AA7BD]/50 focus:border-[#00FF9A]/40 focus:outline-none"
              placeholder={t("auth.confirmPassword")}
            />
          </div>

          {captchaEnabled && (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_152px]">
              <div>
                <label className="mb-1 block text-sm text-[#9AA7BD]">
                  {t("auth.captcha")}
                </label>
                <input
                  type="text"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value)}
                  required={captchaEnabled}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-[#E7EDF7] placeholder-[#9AA7BD]/50 focus:border-[#00FF9A]/40 focus:outline-none"
                  placeholder={t("auth.captchaPlaceholder")}
                />
              </div>

              <button
                type="button"
                onClick={loadCaptcha}
                className="mt-[25px] flex h-[50px] items-center justify-center rounded-xl border border-[#00FF9A]/20 bg-[radial-gradient(circle_at_top,rgba(0,255,154,0.18),rgba(11,18,32,0.96)_65%)] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition hover:border-[#00FF9A]/40"
                aria-label={t("auth.refreshCaptcha")}
              >
                {captchaUrl ? (
                  <span className="block h-full w-full overflow-hidden rounded-[10px] bg-[#09111d]">
                    <img
                      src={captchaUrl}
                      alt={t("auth.captcha")}
                      className="h-full w-full scale-x-110 object-cover object-center"
                    />
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#9AA7BD]">
                    {t("auth.refreshCaptcha")}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#00FF9A] py-3 text-sm font-semibold text-[#070A0F] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : t("auth.createAccount")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9AA7BD]">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-[#00FF9A] hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
