import { useMemo, useState } from "react";

export default function Fc26() {
  const packages = useMemo(
    () => [
      { id: "100k", label: "100K Coins", eta: "< 30 mins" },
      { id: "300k", label: "300K Coins", eta: "< 60 mins" },
      { id: "500k", label: "500K Coins", eta: "1–2 hours" },
      { id: "1m", label: "1M Coins", eta: "2–4 hours" },
    ],
    []
  );

  const [platform, setPlatform] = useState("PlayStation");
  const [pack, setPack] = useState(packages[1].id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">FC26 Ultimate Team Coins</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
            MVP ordering flow (no payment yet). Bank gateway will be added after approval.
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
                  <div className="text-sm font-semibold">{x.label}</div>
                  <div className="mt-1 text-xs text-[#9AA7BD]">ETA: {x.eta}</div>
                </div>
                <div className="text-xs text-[#9AA7BD]">Price: —</div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[#9AA7BD]">
            Safety note: avoid sharing sensitive account details. Only provide necessary info once
            the final delivery method is confirmed.
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
              Selected: <span className="text-[#E7EDF7] font-semibold">{platform}</span> •{" "}
              <span className="text-[#E7EDF7] font-semibold">
                {packages.find((p) => p.id === pack)?.label}
              </span>
            </div>

            <textarea
              className="min-h-[110px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/30"
              placeholder="Notes (optional): preferred delivery time, etc."
            />

            <button className="rounded-2xl bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]">
              Submit Order (No payment yet)
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
            Next step: when the bank gateway is ready, this will redirect to real checkout.
          </div>
        </div>
      </div>
    </main>
  );
}
