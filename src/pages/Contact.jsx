export default function Contact() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Contact</h1>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        For business inquiries, support, or partnership requests, please contact us
        using the information below.
      </p>

      <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
        <div className="text-sm font-semibold">Email</div>
        <div className="mt-1 text-sm text-[#00FF9A]">support@valbri.com</div>

        <div className="mt-4 text-xs text-[#9AA7BD]">
          Support response time: within 24 hours
        </div>
      </div>
    </main>
  );
}
