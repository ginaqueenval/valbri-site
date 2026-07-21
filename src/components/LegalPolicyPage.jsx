import { useEffect, useState } from "react";
import { LEGAL_ENTITY } from "../legal/policies.js";
import { loadPolicyForDisplay } from "../legal/policyClient.js";

const LABELS = Object.freeze({
  effectiveDate: "Effective date",
  version: "Version",
  policyType: "Policy type",
  operator: "Operator",
  contents: "Contents",
  contact: "Contact",
});

const sectionId = (type, index) => `${type}-section-${index + 1}`;
const contactEmail = (type) =>
  ({
    terms: LEGAL_ENTITY.legalEmail,
    privacy: LEGAL_ENTITY.privacyEmail,
    cookies: LEGAL_ENTITY.privacyEmail,
    refund: LEGAL_ENTITY.supportEmail,
  })[type] || LEGAL_ENTITY.supportEmail;

export default function LegalPolicyPage({ type, children = null }) {
  const [state, setState] = useState({ type, loading: true, policy: null, error: "" });

  useEffect(() => {
    let active = true;
    loadPolicyForDisplay(type)
      .then(({ policy }) => {
        if (active) setState({ type, loading: false, policy, error: "" });
      })
      .catch(() => {
        if (active) {
          setState({
            type,
            loading: false,
            policy: null,
            error: "This policy is temporarily unavailable.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [type]);

  if (state.loading || state.type !== type) {
    return <main className="mx-auto min-h-[45vh] w-full max-w-5xl px-4 py-16">Loading policy...</main>;
  }
  if (!state.policy) {
    return (
      <main className="mx-auto min-h-[45vh] w-full max-w-5xl px-4 py-16" role="alert">
        {state.error}
      </main>
    );
  }

  const policy = state.policy;
  const policyContactEmail = contactEmail(type);
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:pt-14" lang="en">
      <header className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{policy.title}</h1>
        <dl className="mt-6 grid gap-3 text-xs text-[#8794AA] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt>{LABELS.policyType}</dt>
            <dd className="mt-1 font-semibold capitalize text-[#D8E0EC]">{policy.type}</dd>
          </div>
          <div>
            <dt>{LABELS.version}</dt>
            <dd className="mt-1 font-semibold text-[#D8E0EC]">{policy.version}</dd>
          </div>
          <div>
            <dt>{LABELS.effectiveDate}</dt>
            <dd className="mt-1 font-semibold text-[#D8E0EC]">{policy.effectiveDate}</dd>
          </div>
          <div>
            <dt>{LABELS.operator}</dt>
            <dd className="mt-1 font-semibold text-[#D8E0EC]">{LEGAL_ENTITY.name}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-10 pt-8 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={LABELS.contents} className="md:sticky md:top-28 md:self-start">
          <h2 className="text-xs font-bold uppercase text-[#7D8AA1]">{LABELS.contents}</h2>
          <ol className="mt-3 grid gap-2 text-sm text-[#AAB5C8]">
            {policy.sections.map((section, index) => (
              <li key={section.heading}>
                <a className="hover:text-[#00FF9A]" href={`#${sectionId(type, index)}`}>
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0">
          {policy.sections.map((section, index) => (
            <section
              className="scroll-mt-28 border-b border-white/8 py-7 first:pt-0"
              id={sectionId(type, index)}
              key={section.heading}
            >
              <h2 className="text-lg font-bold leading-7 text-[#EDF3FC]">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-[#AAB5C8]">{section.body}</p>
            </section>
          ))}

          {children}

          <section className="mt-8 rounded-lg border border-[#00FF9A]/20 bg-[#00FF9A]/5 p-5">
            <h2 className="text-sm font-bold text-[#DFFFEF]">{LABELS.contact}</h2>
            <p className="mt-2 text-sm leading-6 text-[#AAB5C8]">
              {LEGAL_ENTITY.name} · {LEGAL_ENTITY.address}
            </p>
            <a
              className="mt-2 inline-block text-sm font-semibold text-[#00FF9A] hover:text-[#7BFFCA]"
              href={`mailto:${policyContactEmail}`}
            >
              {policyContactEmail}
            </a>
          </section>
        </article>
      </div>
    </main>
  );
}
