export default function Terms() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Terms & Conditions</h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Welcome to Valbri. By accessing or using this website, you agree to be bound
        by the following terms and conditions.
      </p>

      <h2 className="mt-8 text-lg font-bold">Service Scope</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Valbri operates as a gaming marketplace focused on FC26 Ultimate Team coins
        and selected game-related services. This website is currently operating in
        MVP mode.
      </p>

      <h2 className="mt-6 text-lg font-bold">Payments</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Payments are currently disabled. A bank payment gateway will be integrated
        after the website is finalized and approved.
      </p>

      <h2 className="mt-6 text-lg font-bold">User Responsibilities</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Users are responsible for providing accurate information when submitting
        orders and must not share unnecessary or sensitive account details.
      </p>

      <h2 className="mt-6 text-lg font-bold">Changes</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Valbri reserves the right to update or modify these terms at any time.
      </p>

      <div className="mt-8 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </main>
  );
}
