import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPackageList } from "../api/package";
import { getGameList } from "../api/game";
import Announcement from "../components/Announcement";
import { resolveLocalizedGameName } from "../utils/contentLocale.js";

const FALLBACK_PACKAGES = [
  {
    coins: 300000,
    giftCoins: 30000,
    price: 5.39,
    eta: "< 60 mins",
    noteTag: "bestSeller",
  },
  {
    coins: 400000,
    giftCoins: 40000,
    price: 7.19,
    eta: "< 90 mins",
    noteTag: "popular",
  },
  {
    coins: 500000,
    giftCoins: 50000,
    price: 8.99,
    eta: "1–2 hours",
    noteTag: "bestValue",
  },
  {
    coins: 700000,
    giftCoins: 70000,
    price: 12.59,
    eta: "2–4 hours",
    noteTag: "fastDelivery",
  },
  {
    coins: 800000,
    giftCoins: 80000,
    price: 14.39,
    eta: "3–5 hours",
    noteTag: "highVolume",
  },
  {
    coins: 1000000,
    giftCoins: 100000,
    price: 17.99,
    eta: "4–8 hours",
    noteTag: "vip",
  },
  {
    coins: 1200000,
    giftCoins: 120000,
    price: 21.59,
    eta: "6–12 hours",
    noteTag: "maxPack",
  },
];

const FALLBACK_GAMES = [
  {
    id: "fallback-fc26",
    name: "FC26 Ultimate Team 金币",
    nameEn: "FC26 Ultimate Team Coins (FUT Coins)",
  },
  { id: "fallback-wow", name: "魔兽世界", nameEn: "World of Warcraft" },
  { id: "fallback-dune", name: "Dune", nameEn: "Dune" },
  { id: "fallback-pubg", name: "PUBG", nameEn: "PUBG" },
  { id: "fallback-valorant", name: "无畏契约", nameEn: "Valorant" },
  { id: "fallback-delta", name: "三角洲行动", nameEn: "Delta Force" },
  { id: "fallback-codm", name: "COD Mobile", nameEn: "COD Mobile" },
];
const FEATURED_SKELETON_COUNT = FALLBACK_PACKAGES.length;

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

const sortPackages = (list) =>
  [...list].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER));

const noteLabel = (tag, t) => {
  if (!tag) return null;
  const key = `notes.${tag}`;
  const translated = t(key);
  return translated === key ? tag : translated;
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [games, setGames] = useState(FALLBACK_GAMES);

  useEffect(() => {
    getPackageList({ gameId: 1 })
      .then((res) => {
        setPackages(
          res.data && res.data.length > 0
            ? sortPackages(res.data)
            : sortPackages(FALLBACK_PACKAGES),
        );
      })
      .catch(() => {
        setPackages(sortPackages(FALLBACK_PACKAGES));
      })
      .finally(() => {
        setPackagesLoading(false);
      });

    getGameList()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setGames(res.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main>
      <Announcement />
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/25 bg-[#0B1220]/60 px-3 py-1 text-xs text-[#9AA7BD]">
              <span className="h-2 w-2 rounded-full bg-[#00FF9A]" />
              {t("home.badge")}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              {t("home.title")}
              <span className="text-[#00FF9A]">{t("home.titleHighlight")}</span>
              {t("home.titleEnd")}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#9AA7BD]">
              {t("home.description")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/fc26-coins"
                className="rounded-2xl bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#070A0F] shadow-[0_0_0_1px_rgba(0,255,154,.25),0_10px_30px_rgba(0,255,154,.12)] hover:bg-[#00D47E]"
              >
                {t("home.viewPackages")}
              </Link>
              <button
                onClick={() =>
                  document
                    .getElementById("games")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-[#E7EDF7] hover:border-[#00FF9A]/30"
              >
                {t("home.browseGames")}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: "guarantee" },
                { key: "safe" },
                { key: "pricing" },
                { key: "gateway" },
              ].map((x) => (
                <div
                  key={x.key}
                  className="rounded-2xl border border-white/5 bg-[#0B1220]/60 p-4"
                >
                  <div className="text-sm font-semibold">
                    {t(`home.features.${x.key}.title`)}
                  </div>
                  <div className="mt-1 text-xs text-[#9AA7BD]">
                    {t(`home.features.${x.key}.desc`)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  {t("home.featuredTitle")}
                </div>
                <div className="text-xs text-[#9AA7BD]">
                  {t("home.featuredSubtitle")}
                </div>
              </div>
              <div className="rounded-full border border-[#00FF9A]/25 bg-[#00FF9A]/10 px-3 py-1 text-xs text-[#00FF9A]">
                {t("home.live")}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {packagesLoading
                ? Array.from({ length: FEATURED_SKELETON_COUNT }).map((_, index) => (
                    <div
                      key={`featured-skeleton-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="h-5 w-40 animate-pulse rounded-full bg-white/8" />
                        <div className="mt-3 h-4 w-28 animate-pulse rounded-full bg-white/6" />
                      </div>
                      <div className="ml-4 w-20 shrink-0 text-right">
                        <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-white/8" />
                        <div className="mt-3 ml-auto h-4 w-10 animate-pulse rounded-full bg-white/6" />
                      </div>
                    </div>
                  ))
                : packages.map((p) => (
                    <div
                      key={p.id || p.coins}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4 hover:border-[#00FF9A]/25"
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {fmtK(p.coins)} {t("home.coins")}{" "}
                          {p.giftCoins > 0 && (
                            <span className="text-[#00FF9A]">
                              + {fmtK(p.giftCoins)} {t("home.gift")}
                            </span>
                          )}
                          {noteLabel(p.noteTag, t) && (
                            <span className="ml-2 text-xs text-[#00FF9A]">
                              {noteLabel(p.noteTag, t)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-[#9AA7BD]">
                          {t("home.eta", { eta: p.eta })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {fmtPrice(p.price, p.currency)}
                        </div>
                        <div className="mt-1 text-xs text-[#9AA7BD]">
                          {p.currency || "USD"}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
              {t("home.paymentNotice")}
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-extrabold">{t("home.gamesTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
          {t("home.gamesDesc")}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <div
              key={g.id || g.nameEn || g.name || i}
              className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6"
            >
              <div className="text-sm font-semibold">
                {resolveLocalizedGameName(g, i18n.language)}
              </div>
              <div className="mt-2 text-xs text-[#9AA7BD]">
                {t("home.comingSoon")}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
