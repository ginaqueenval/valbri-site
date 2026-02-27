import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Fc26() {
  const navigate = useNavigate();

  const packages = useMemo(
    () => [
      {
        id: "300k",
        coins: 300_000,
        gift: 30_000,
        price: 5.39,
        eta: "< 60 mins",
        widgetUrl: "https://widget.lava.top/8ab2f75a-da9d-4c72-9cb0-963eac636284",
      },
      {
        id: "400k",
        coins: 400_000,
        gift: 40_000,
        price: 7.19,
        eta: "< 90 mins",
        widgetUrl: "",
      },
      {
        id: "500k",
        coins: 500_000,
        gift: 50_000,
        price: 8.99,
        eta: "1–2 hours",
        widgetUrl: "",
      },
      {
        id: "700k",
        coins: 700_000,
        gift: 70_000,
        price: 12.59,
        eta: "2–4 hours",
        widgetUrl: "",
      },
      {
        id: "800k",
        coins: 800_000,
        gift: 80_000,
        price: 14.39,
        eta: "3–5 hours",
        widgetUrl: "",
      },
      {
        id: "1000k",
        coins: 1_000_000,
        gift: 100_000,
        price: 17.99,
        eta: "4–8 hours",
        widgetUrl: "",
      },
      {
        id: "1200k",
        coins: 1_200_000,
        gift: 120_000,
        price: 21.59,
        eta: "6–12 hours",
        widgetUrl: "",
      },
    ],
    []
  );

  const [platform, setPlatform] = useState("PlayStation");

  const fmtCoins = (n) => {
    const k = Math.round(n / 1000);
    return k.toLocaleString("en-US") + "K";
  };

  const fmtPrice = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const goCheckout = (pkg) => {
    // میره به صفحه checkout و دیتای محصول رو می‌فرسته
    navigate("/checkout", {
      state: {
        platform,
        packId: pkg.id,
        // اینا رو هم می‌فرستیم که checkout راحت‌تر باشه و لازم نباشه دوباره لیست رو اونجا تعریف کنی
        coins: pkg.coins,
        gift: pkg.gift,
        price: pkg.price,
        eta: pkg.eta,
        widgetUrl: pkg.widgetUrl,
      },
    });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">FC26 Ultimate Team Coins</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
            Select your platform and package. Click <span className="text-[#00FF9A] font-semibold">Buy</span> to checkout.
          </p>
        </div>

        <div className="rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 px-4 py-2 text-sm text-[#9AA7BD]">
          Payment: <span className="text-[#00FF9A] font-semibold">Lava</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Left: Platform + Packages */}
        <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <h2 className="text-lg font-bold">Select Platform</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["PlayStation", "Xbox", "PC"].map((p) => (
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

          <h2 className="mt-8 text-lg font-bold">Packages</h2>
          <div className="mt-4 grid gap-3">
            {packages.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-[#00FF9A]/25"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {fmtCoins(x.coins)} Coins{" "}
                    <span className="text-[#00FF9A]">+ {fmtCoins(x.gift)} Gift</span>
                  </div>
                  <div className="mt-1 text-xs text-[#9AA7BD]">ETA: {x.eta}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-semibold">{fmtPrice(x.price)}</div>

                  <button
                    onClick={() => goCheckout(x)}
                    className="rounded-xl bg-[#00FF9A] px-4 py-2 text-xs font-semibold text-[#070A0F] hover:bg-[#00D47E]"
                  >
                    Buy
                  </button>

                  {!x.widgetUrl ? (
                    <div className="text-[11px] text-[#9AA7BD]">Widget not set</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: simple info card (بدون فرم/بدون متن‌های اضافی پایین) */}
        <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <h2 className="text-lg font-bold">Checkout</h2>
          <p className="mt-2 text-sm text-[#9AA7BD] leading-7">
            Click <span className="text-[#00FF9A] font-semibold">Buy</span> on any package to go to the checkout page for that product.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[#9AA7BD]">
            Tip: If a package shows <span className="text-[#E7EDF7] font-semibold">Widget not set</span>, paste its Lava widget URL into the list.
          </div>
        </div>
      </div>
    </main>
  );
}