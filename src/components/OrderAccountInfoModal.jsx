import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOrderAccountInfo, saveOrderAccountInfo } from "../api/order";
import { formatTime, isAccountInfoSubmitted } from "../utils/orderDisplay";
import useBodyScrollLock from "../utils/useBodyScrollLock.js";

const emptyForm = {
  gameAccount: "",
  gamePassword: "",
  backupCodes: "",
};

const maskPassword = (value) => (value ? "•".repeat(Math.max(8, Math.min(value.length, 16))) : "-");

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.3 3.1M6.4 6.5C3.8 8.2 2.5 12 2.5 12s3.5 7 9.5 7c1.6 0 3-.4 4.2-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function OrderAccountInfoModal({ order, open, onSaved, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [editing, setEditing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submitted = isAccountInfoSubmitted(order);
  const displayTime = useMemo(
    () => accountInfo?.updatedAt || accountInfo?.submittedAt || accountInfo?.createTime,
    [accountInfo],
  );

  useEffect(() => {
    if (!open || !order) {
      return;
    }

    setError("");
    setShowPassword(false);
    setAccountInfo(null);
    setForm(emptyForm);

    if (!submitted) {
      setEditing(true);
      return;
    }

    if (order.accountInfo) {
      const data = order.accountInfo;
      setEditing(false);
      setLoadingInfo(false);
      setAccountInfo(data);
      setForm({
        gameAccount: data.gameAccount || "",
        gamePassword: data.gamePassword || "",
        backupCodes: data.backupCodes || "",
      });
      return;
    }

    let cancelled = false;
    setEditing(false);
    setLoadingInfo(true);
    getOrderAccountInfo(order.id)
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        setAccountInfo(data);
        setForm({
          gameAccount: data.gameAccount || "",
          gamePassword: data.gamePassword || "",
          backupCodes: data.backupCodes || "",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || t("orderAccount.loadFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInfo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, order, submitted, t]);

  // 锁背景滚动 — hook 必须在 early return 之前调用,
  // open+order 同时存在才视为真正打开
  useBodyScrollLock(open && !!order);

  if (!open || !order) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.gameAccount.trim() || !form.gamePassword.trim() || !form.backupCodes.trim()) {
      setError(t("orderAccount.required"));
      return;
    }
    // 备份码白名单:数字 + 任何空白(空格/换行/Tab)+ 任意 Unicode 标点
    // 例如:123·567 / 234-567 / 多行用 \n 分隔等多种形态
    // 排除任何字母,防止用户错填账号/密码到此字段
    if (!/^[\d\s\p{P}]+$/u.test(form.backupCodes.trim())) {
      setError(t("orderAccount.backupCodesNumericOnly"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveOrderAccountInfo(order.id, {
        gameAccount: form.gameAccount.trim(),
        gamePassword: form.gamePassword.trim(),
        backupCodes: form.backupCodes.trim(),
      });
      setAccountInfo({
        ...(accountInfo || {}),
        gameAccount: form.gameAccount.trim(),
        gamePassword: form.gamePassword.trim(),
        backupCodes: form.backupCodes.trim(),
        updatedAt: new Date().toISOString(),
        submittedAt: accountInfo?.submittedAt || new Date().toISOString(),
      });
      setShowPassword(false);
      setEditing(false);
      // 第二参数告知父组件本次是「新提交」还是「修改保存」,父级用于选 toast 文案
      onSaved?.(order.id, { isEdit: submitted });
    } catch (err) {
      setError(err.message || t("orderAccount.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderViewRow = (label, value, extra) => (
    <div className="grid gap-2 rounded-xl border border-white/5 bg-white/[0.04] p-3 text-sm">
      <div className="text-xs font-semibold text-[#9AA7BD]">{label}</div>
      <div className="flex min-h-[24px] items-center justify-between gap-3 text-[#E7EDF7]">
        <span className="min-w-0 whitespace-pre-wrap break-words">{value || "-"}</span>
        {extra}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4">
      <div className="modal-sheet scrollbar-thin relative w-full overflow-y-auto rounded-t-[28px] border border-[#00FF9A]/20 border-b-transparent bg-[linear-gradient(180deg,rgba(15,22,36,0.96),rgba(8,12,20,0.98))] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-left shadow-[0_-24px_60px_rgba(0,0,0,0.45)] sm:max-w-lg sm:rounded-[24px] sm:border-b sm:p-7 sm:pb-7 sm:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        {/* 移动端顶部拖动手柄(纯装饰,无交互) */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3 sm:block sm:text-center">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
              {t("orderAccount.badge")}
            </div>
            <h2 className="mt-1.5 text-lg font-black tracking-[-0.02em] sm:mt-2 sm:text-2xl">
              {submitted ? t("orderAccount.viewTitle") : t("orderAccount.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("orderAccount.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] sm:absolute sm:right-4 sm:top-4"
          >
            ×
          </button>
        </div>
        <div className="mt-2 sm:text-center">
          <p className="text-[13px] leading-5 text-[#9AA7BD] sm:text-sm sm:leading-6">
            {submitted ? t("orderAccount.viewDesc") : t("orderAccount.desc")}
          </p>
          <p className="mt-1.5 text-[13px] font-semibold leading-5 text-[#7BFFCA] sm:mt-2 sm:text-sm sm:leading-6">
            {t("orderAccount.encryptedNotice")}
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-[#9AA7BD]">
          <span className="font-mono text-[#E7EDF7]">{order.orderNo}</span>
          {order.packageName ? <span className="ml-2">{order.packageName}</span> : null}
        </div>

        {loadingInfo ? (
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.04] p-5 text-center text-sm text-[#9AA7BD]">
            {t("orderAccount.loading")}
          </div>
        ) : !editing && submitted ? (
          <div className="mt-5 grid gap-3 text-left">
            {renderViewRow(t("orderAccount.gameAccount"), accountInfo?.gameAccount)}
            {renderViewRow(
              t("orderAccount.gamePassword"),
              showPassword ? accountInfo?.gamePassword : maskPassword(accountInfo?.gamePassword),
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#00FF9A]"
                aria-label={showPassword ? t("orderAccount.hidePassword") : t("orderAccount.showPassword")}
              >
                <EyeIcon visible={showPassword} />
              </button>,
            )}
            {renderViewRow(t("orderAccount.backupCodes"), accountInfo?.backupCodes)}
            {renderViewRow(t("orderAccount.submittedTime"), formatTime(displayTime))}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="cta-primary min-h-[48px] w-full px-6 py-3 text-sm"
            >
              {t("orderAccount.edit")}
            </button>
          </div>
        ) : (
          <form className="mt-5 grid gap-4 text-left" onSubmit={submit}>
            <label className="grid gap-2 text-sm">
              <span className="font-semibold">{t("orderAccount.gameAccount")}</span>
              <input
                value={form.gameAccount}
                onChange={(event) => updateField("gameAccount", event.target.value)}
                className="min-h-[44px] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base outline-none transition-colors focus:border-[#00FF9A]/50"
                autoComplete="off"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-semibold">{t("orderAccount.gamePassword")}</span>
              <input
                type="password"
                value={form.gamePassword}
                onChange={(event) => updateField("gamePassword", event.target.value)}
                className="min-h-[44px] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base outline-none transition-colors focus:border-[#00FF9A]/50"
                autoComplete="off"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{t("orderAccount.backupCodes")}</span>
                {/* 教学引导入口 — 新浏览器 tab 打开 /guide/backup-codes,原表单零干扰
                    HashRouter 部署,故 href 使用 #/guide/... 形态以保持跨环境一致 */}
                <a
                  href="#/guide/backup-codes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7BFFCA] underline decoration-[#00FF9A]/40 decoration-dotted underline-offset-4 transition-colors hover:text-[#00FF9A]"
                >
                  {t("orderAccount.howToGetBackupCodes")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="h-3 w-3"
                  >
                    <path
                      d="M14 4h6v6M20 4L10 14M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </span>
              {/* 多行 textarea — 备份码常为多组(每组 6-8 位数字 + 分隔符),
                  EA Keychain 一次性生成 8-10 组,玩家粘贴入弹窗需多行容纳。
                  校验范围放宽至「数字 + 任意空白 + 任意 Unicode 标点」,
                  字母仍被排除,避免误填账号/密码 */}
              <textarea
                value={form.backupCodes}
                onChange={(event) => updateField("backupCodes", event.target.value)}
                rows={4}
                placeholder={t("orderAccount.backupCodesPlaceholder")}
                autoComplete="off"
                spellCheck={false}
                className="min-h-[120px] resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base leading-6 outline-none transition-colors focus:border-[#00FF9A]/50"
              />
            </label>
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {submitted && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-[#E7EDF7] hover:border-[#00FF9A]/30"
                >
                  {t("orderAccount.cancelEdit")}
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className={`cta-primary min-h-[48px] px-6 py-3 text-sm ${
                  submitted ? "" : "sm:col-span-2"
                }`}
              >
                {saving
                  ? t("orderAccount.saving")
                  : submitted
                    ? t("orderAccount.resubmit")
                    : t("orderAccount.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
