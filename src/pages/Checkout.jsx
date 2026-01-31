export default function Checkout() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        Payments are currently disabled in the MVP. A bank payment gateway will be integrated after the
        website is finalized and approved.
      </p>

      <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
        <div className="text-sm font-semibold text-[#00FF9A]">Status</div>
        <div className="mt-2 text-sm text-[#9AA7BD]">
          Bank gateway: <span className="text-[#E7EDF7] font-semibold">Coming soon</span>
        </div>
      </div>
    </main>
  );
}
