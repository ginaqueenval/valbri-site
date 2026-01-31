export default function Privacy() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Privacy Policy</h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Valbri respects your privacy and is committed to protecting your personal
        information.
      </p>

      <h2 className="mt-8 text-lg font-bold">Information We Collect</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        During the MVP phase, we may collect basic contact information such as name
        and email address when users submit an order or inquiry.
      </p>

      <h2 className="mt-6 text-lg font-bold">Use of Information</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Collected information is used solely for communication, order processing,
        and service improvement purposes.
      </p>

      <h2 className="mt-6 text-lg font-bold">Payments & Security</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        No payment information is collected at this stage. Secure bank payment
        processing will be introduced after approval.
      </p>

      <h2 className="mt-6 text-lg font-bold">Data Sharing</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Valbri does not sell or share personal data with third parties.
      </p>

      <div className="mt-8 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </main>
  );
}
