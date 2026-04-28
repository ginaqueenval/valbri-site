import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPlayerCaptcha, playerLogin } from "../api/auth";
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
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-8">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#00FF9A]/25 bg-[#0B1220]">
            <span className="text-base font-semibold text-[#00FF9A]">V</span>
          </div>
          <h1 className="text-xl font-semibold text-[#E7EDF7]">
            {t("auth.loginTitle")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {successMessage ? (
            <div className="rounded-xl border border-[#00FF9A]/20 bg-[#00FF9A]/10 p-3 text-sm text-[#7BFFCA]">
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}

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

          {captchaEnabled ? (
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
                className="flex h-[50px] items-center justify-center rounded-xl border border-[#00FF9A]/25 bg-[#07101b] p-[3px] shadow-[0_0_18px_rgba(0,255,154,0.08)] transition hover:border-[#00FF9A]/45 sm:mt-[25px]"
                aria-label={t("auth.refreshCaptcha")}
              >
                {captchaUrl ? (
                  <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#09111d] px-1.5">
                    <img
                      src={captchaUrl}
                      alt={t("auth.captcha")}
                      className="block h-[84%] w-full scale-[1.02] object-contain object-center"
                    />
                    <span className="pointer-events-none absolute inset-y-1 left-0 w-1.5 bg-[#09111d]" />
                    <span className="pointer-events-none absolute inset-y-1 right-0 w-1.5 bg-[#09111d]" />
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#9AA7BD]">
                    {t("auth.refreshCaptcha")}
                  </span>
                )}
              </button>
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-[#9AA7BD]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-black/20 text-[#00FF9A] focus:ring-[#00FF9A]/40"
            />
            {t("auth.rememberMe")}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#00FF9A] py-3 text-sm font-semibold text-[#070A0F] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : t("auth.signIn")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9AA7BD]">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-[#00FF9A] hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
