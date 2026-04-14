import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  const games = [
    "FC26 Ultimate Team Coins (FUT Coins)",
    "World of Warcraft",
    "Dune",
    "PUBG",
    "Valorant",
    "Delta Force",
    "COD Mobile",
  ];

  const fcPackages = [
    { coins: "300K", gift: "30K", price: 5.39, eta: "< 60 mins", note: "bestSeller" },
    { coins: "400K", gift: "40K", price: 7.19, eta: "< 90 mins", note: "popular" },
    { coins: "500K", gift: "50K", price: 8.99, eta: "1–2 hours", note: "bestValue" },
    { coins: "700K", gift: "70K", price: 12.59, eta: "2–4 hours", note: "fastDelivery" },
    { coins: "800K", gift: "80K", price: 14.39, eta: "3–5 hours", note: "highVolume" },
    { coins: "1,000K", gift: "100K", price: 17.99, eta: "4–8 hours", note: "vip" },
    { coins: "1,200K", gift: "120K", price: 21.59, eta: "6–12 hours", note: "maxPack" },
  ];

  const fmtPrice = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/25 bg-[#0B1220]/60 px-3 py-1 text-xs text-[#9AA7BD]">
              <span className="h-2 w-2 rounded-full bg-[#00FF9A]" />
              {t('home.badge')}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              {t('home.title')}
              <span className="text-[#00FF9A]">{t('home.titleHighlight')}</span>{t('home.titleEnd')}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#9AA7BD]">
              {t('home.description')}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/fc26-coins"
                className="rounded-2xl bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#070A0F] shadow-[0_0_0_1px_rgba(0,255,154,.25),0_10px_30px_rgba(0,255,154,.12)] hover:bg-[#00D47E]"
              >
                {t('home.viewPackages')}
              </Link>
              <a
                href="#games"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-[#E7EDF7] hover:border-[#00FF9A]/30"
              >
                {t('home.browseGames')}
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: 'guarantee' },
                { key: 'safe' },
                { key: 'pricing' },
                { key: 'gateway' },
              ].map((x) => (
                <div key={x.key} className="rounded-2xl border border-white/5 bg-[#0B1220]/60 p-4">
                  <div className="text-sm font-semibold">{t(`home.features.${x.key}.title`)}</div>
                  <div className="mt-1 text-xs text-[#9AA7BD]">{t(`home.features.${x.key}.desc`)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t('home.featuredTitle')}</div>
                <div className="text-xs text-[#9AA7BD]">{t('home.featuredSubtitle')}</div>
              </div>
              <div className="rounded-full border border-[#00FF9A]/25 bg-[#00FF9A]/10 px-3 py-1 text-xs text-[#00FF9A]">
                {t('home.live')}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {fcPackages.map((p) => (
                <div
                  key={p.coins}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4 hover:border-[#00FF9A]/25"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {p.coins} {t('home.coins')}{" "}
                      <span className="text-[#00FF9A]">+ {p.gift} {t('home.gift')}</span>{" "}
                      <span className="ml-2 text-xs text-[#00FF9A]">{t(`notes.${p.note}`)}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#9AA7BD]">{t('home.eta', { eta: p.eta })}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmtPrice(p.price)}</div>
                    <div className="mt-1 text-xs text-[#9AA7BD]">{t('home.usd')}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
              {t('home.paymentNotice')}
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-extrabold">{t('home.gamesTitle')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
          {t('home.gamesDesc')}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <div key={g} className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
              <div className="text-sm font-semibold">{g}</div>
              <div className="mt-2 text-xs text-[#9AA7BD]">{t('home.comingSoon')}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}