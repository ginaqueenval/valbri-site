import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { playerLogin } from "../api/auth";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await playerLogin({ username, password });
      localStorage.setItem("player_token", res.token);
      localStorage.setItem("player_info", JSON.stringify(res.player));
      const pending = sessionStorage.getItem("pending_checkout");
      if (pending) {
        navigate("/checkout", { state: JSON.parse(pending) });
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
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
            {t("auth.loginTitle")}
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
