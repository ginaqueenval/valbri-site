import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPackageList } from "../api/package";
import { getPlayerToken } from "../utils/request";

const PLATFORMS = ["PlayStation", "Xbox", "PC"];

const fmtK = (n) => {
  if (!n) return "0";
  if (n < 1000) return String(n);
  const k = Math.round(n / 1000);
  return k.toLocaleString("en-US") + "K";
};

const fmtPrice = (n, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(n);

const noteLabel = (tag, t) => {
  if (!tag) return null;
  const key = `notes.${tag}`;
  const translated = t(key);
  return translated === key ? tag : translated;
};

export default function Fc26() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [platform, setPlatform] = useState("PlayStation");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPackageList({ gameId: 1, platform })
      .then((res) => {
        setPackages(res.data || []);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [platform]);

  const goCheckout = (pkg) => {
    if (!getPlayerToken()) {
      navigate("/login");
      return;
    }
    navigate("/checkout", {
      state: {
        platform,
        packageId: pkg.id,
        coins: pkg.coins,
        giftCoins: pkg.giftCoins,
        price: pkg.price,
        eta: pkg.eta,
        widgetUrl: pkg.widgetUrl,
        packageName: pkg.name,
        currency: pkg.currency || "USD",
      },
    });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">{t("fc26.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
            {t("fc26.description")}{" "}
            <span className="text-[#00FF9A] font-semibold">
              {t("fc26.descriptionHighlight")}
            </span>
            {t("fc26.descriptionEnd")}
          </p>
        </div>

        <div className="rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 px-4 py-2 text-sm text-[#9AA7BD]">
          {t("fc26.payment")}{" "}
          <span className="text-[#00FF9A] font-semibold">
            {t("fc26.paymentProvider")}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <h2 className="text-lg font-bold">{t("fc26.selectPlatform")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={
                  "rounded-xl px-4 py-2 text-sm font-semibold border " +
                  (platform === p
                    ? "border-[#00FF9A]/40 bg-[#00FF9A]/10 text-[#00FF9A]"
                    : "border-white/10 bg-white/5 text-[#E7EDF7] hover:border-[#00FF9A]/30")
                }
              >
                {p}
              </button>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-bold">{t("fc26.packages")}</h2>
          <div className="mt-4 grid gap-3">
            {loading ? (
              <div className="py-8 text-center text-sm text-[#9AA7BD]">
                Loading...
              </div>
            ) : packages.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9AA7BD]">
                {t("fc26.noPackages")}
              </div>
            ) : (
              packages.map((x) => (
                <div
                  key={x.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-[#00FF9A]/25"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {fmtK(x.coins)} {t("fc26.coins")}{" "}
                      {x.giftCoins > 0 && (
                        <span className="text-[#00FF9A]">
                          + {fmtK(x.giftCoins)} {t("fc26.gift")}
                        </span>
                      )}
                      {noteLabel(x.noteTag, t) && (
                        <span className="ml-2 text-xs text-[#00FF9A]">
                          {noteLabel(x.noteTag, t)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-[#9AA7BD]">
                      {t("fc26.eta", { eta: x.eta })}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm font-semibold">
                      {fmtPrice(x.price, x.currency)}
                    </div>

                    <button
                      onClick={() => goCheckout(x)}
                      className="rounded-xl bg-[#00FF9A] px-4 py-2 text-xs font-semibold text-[#070A0F] hover:bg-[#00D47E]"
                    >
                      {t("fc26.buy")}
                    </button>

                    {!x.widgetUrl && (
                      <div className="text-[11px] text-[#9AA7BD]">
                        {t("fc26.widgetNotSet")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <h2 className="text-lg font-bold">{t("fc26.checkoutTitle")}</h2>
          <p className="mt-2 text-sm text-[#9AA7BD] leading-7">
            {t("fc26.checkoutDesc")}{" "}
            <span className="text-[#00FF9A] font-semibold">
              {t("fc26.checkoutDescHighlight")}
            </span>
            {t("fc26.checkoutDescEnd")}
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[#9AA7BD]">
            {t("fc26.tip")}{" "}
            <span className="text-[#E7EDF7] font-semibold">
              {t("fc26.tipHighlight")}
            </span>
            {t("fc26.tipEnd")}
          </div>
        </div>
      </div>
    </main>
  );
}
