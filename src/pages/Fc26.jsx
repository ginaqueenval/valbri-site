import { useMemo, useState } from "react";

export default function Fc26() {
  const packages = useMemo(
    () => [
      {
        id: "300k",
        coins: 300_000,
        gift: 30_000,
        price: 5.39,
        eta: "< 60 mins",
      },
      {
        id: "400k",
        coins: 400_000,
        gift: 40_000,
        price: 7.19,
        eta: "< 90 mins",
      },
      {
        id: "500k",
        coins: 500_000,
        gift: 50_000,
        price: 8.99,
        eta: "1–2 hours",
      },
      {
        id: "700k",
        coins: 700_000,
        gift: 70_000,
        price: 12.59,
        eta: "2–4 hours",
      },
      {
        id: "800k",
        coins: 800_000,
        gift: 80_000,
        price: 14.39,
        eta: "3–5 hours",
      },
      {
        id: "1000k",
        coins: 1_000_000,
        gift: 100_000,
        price: 17.99,
        eta: "4–8 hours",
      },
      {
        id: "1200k",
        coins: 1_200_000,
        gift: 120_000,
        price: 21.59,
        eta: "6–12 hours",
      },
    ],
    []
  );

  const [platform, setPlatform] = useState("PlayStation");
  const [pack, setPack] = useState(packages[0].id);

  const selectedPack = packages.find((p) => p.id === pack);

  const fmtCoins = (n) => {
    // 300000 -> 300K, 1000000 -> 1,000K
    const k = Math.round(n / 1000);
    return k.toLocaleString("en-US") + "K";
  };

  const fmtPrice = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">FC26 Ultimate Team Coins</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
            Choose your coin package and submit your order. Payment will be enabled after gateway
            approval.
          </p>
        </div>
        <div className="rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 px-4 py-2 text-sm text-[#9AA7BD]">
          Payment: <span className="text-[#00FF9A] font-semibold">Coming soon</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
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

          <h2 className="mt-8 text-lg font-bold">Choose Package</h2>
          <div className="mt-4 grid gap-3">
            {packages.map((x) => (
              <button
                key={x.id}
                onClick={() => setPack(x.id)}
                className={
                  "flex items-center justify-between rounded-2xl border p-4 text-left " +
                  (pack === x.id
                    ? "border-[#00FF9A]/35 bg-[#00FF9A]/5"
                    : "border-white/10 bg-black/20 hover:border-[#00FF9A]/25")
                }
              >
                <div>
                  <div className="text-sm font-semibold">
                    {fmtCoins(x.coins)} Coins{" "}
                    <span className="text-[#00FF9A]">+ {fmtCoins(x.gift)} Gift</span>
                  </div>
                  <div className="mt-1 text-xs text-[#9AA7BD]">ETA: {x.eta}</div>
                </div>
                <div className="text-sm font-semibold">{fmtPrice(x.price)}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[#9AA7BD]">
            <div className="font-semibold text-[#E7EDF7]">Security & 72-hour guarantee</div>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>All deliveries are handled manually using safe transfer methods.</li>
              <li>Your account security is our top priority.</li>
              <li>Every order is covered by a 72-hour service guarantee after delivery.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <h2 className="text-lg font-bold">Place Order (MVP)</h2>
          <p className="mt-2 text-sm text-[#9AA7BD]">
            This form collects order details. Payment is disabled for now.
          </p>

          <form
            className="mt-5 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              alert("MVP: Order submitted (no payment). Connect this to your backend later.");
            }}
          >
            <input
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/30"
              placeholder="Your name"
              required
            />
            <input
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/30"
              placeholder="Email"
              type="email"
              required
            />

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#9AA7BD]">
              Selected:{" "}
              <span className="text-[#E7EDF7] font-semibold">{platform}</span> •{" "}
              <span className="text-[#E7EDF7] font-semibold">
                {selectedPack
                  ? `${fmtCoins(selectedPack.coins)} + ${fmtCoins(selectedPack.gift)} Gift`
                  : "—"}
              </span>{" "}
              •{" "}
              <span className="text-[#00FF9A] font-semibold">
                {selectedPack ? fmtPrice(selectedPack.price) : "—"}
              </span>
            </div>

            <textarea
              className="min-h-[110px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/30"
              placeholder="Notes (optional): preferred delivery time, player auction/comfort trade, etc."
            />

            <button className="rounded-2xl bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]">
              Submit Order (No payment yet)
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
            Next step: when the Lava gateway is ready, this will redirect to a real checkout and
            mark the order as paid automatically.
          </div>
        </div>
      </div>
    </main>
  );
}
