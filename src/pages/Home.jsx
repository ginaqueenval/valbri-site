import { Link } from "react-router-dom";

export default function Home() {
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
    { coins: "100K", eta: "< 30 mins", note: "Starter" },
    { coins: "300K", eta: "< 60 mins", note: "Best Seller" },
    { coins: "500K", eta: "1–2 hours", note: "Best Value" },
    { coins: "1M", eta: "2–4 hours", note: "VIP" },
  ];

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/25 bg-[#0B1220]/60 px-3 py-1 text-xs text-[#9AA7BD]">
              <span className="h-2 w-2 rounded-full bg-[#00FF9A]" />
              MVP launch — FC26 is featured
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              FC26 Ultimate Team Coins —
              <span className="text-[#00FF9A]"> fast & secure</span> delivery
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#9AA7BD]">
              Valbri is a gaming marketplace focused on FC26 coins and selected game services.
              Bank payment gateway will be integrated after approval.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/fc26-coins"
                className="rounded-2xl bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#070A0F] shadow-[0_0_0_1px_rgba(0,255,154,.25),0_10px_30px_rgba(0,255,154,.12)] hover:bg-[#00D47E]"
              >
                Start FC26 Order
              </Link>
              <a
                href="#games"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-[#E7EDF7] hover:border-[#00FF9A]/30"
              >
                Browse Games
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: "Fast Delivery", v: "Clear ETA per package" },
                { k: "Real Support", v: "Quick responses" },
                { k: "Clean UI", v: "Dark neon theme" },
                { k: "Checkout", v: "Bank gateway soon" },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-white/5 bg-[#0B1220]/60 p-4">
                  <div className="text-sm font-semibold">{x.k}</div>
                  <div className="mt-1 text-xs text-[#9AA7BD]">{x.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Featured Packages</div>
                <div className="text-xs text-[#9AA7BD]">FC26 Ultimate Team Coins</div>
              </div>
              <div className="rounded-full border border-[#00FF9A]/25 bg-[#00FF9A]/10 px-3 py-1 text-xs text-[#00FF9A]">
                MVP
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
                      {p.coins} Coins <span className="ml-2 text-xs text-[#00FF9A]">{p.note}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#9AA7BD]">Delivery ETA: {p.eta}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">—</div>
                    <div className="mt-1 text-xs text-[#9AA7BD]">Pricing soon</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
              Payments are disabled in MVP. Bank gateway will be added after the website is finalized.
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-extrabold">Games</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
          We currently focus on FC26, and also support the following games.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <div key={g} className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
              <div className="text-sm font-semibold">{g}</div>
              <div className="mt-2 text-xs text-[#9AA7BD]">Page & pricing: coming soon</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
