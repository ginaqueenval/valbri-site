export default function Privacy() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Privacy Policy</h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        Valbri respects your privacy and is committed to protecting your personal
        information.In this section, we provide you with essential information about our line of work and our Privacy Policy. A privacy policy is a legal document that explains how your website collects, uses, and protects visitors’ personal data, ensuring transparency and compliance with privacy laws.
Here, at the first step, you will receive necessary data about how do we collect and use your personal data to give you efficient services. In order to have accurate knowledge about your legal rights and choices associated with your personal data, we recommend you to read our Privacy Policy section precisely.
Note that valbri.net reserves the right to update, modify or amend the website Privacy Policy at any time. Any changes will become effective upon posting the revised version on this website. So, do not forget to review this Policy periodically to stay informed of any updates.
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
