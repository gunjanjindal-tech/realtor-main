export default function AgentTrust() {
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* LEFT CONTENT */}
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Your Local Advantage
          </span>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight text-[#091D35]">
            Trusted Nova Scotia <br />
            Real Estate Expertise
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-600 max-w-xl">
            Buying a home is one of the most important decisions you’ll ever
            make. You deserve guidance from a local expert who understands
            Nova Scotia’s neighbourhoods, pricing trends, and opportunities —
            inside and out.
          </p>

          {/* Trust Points */}
          <ul className="mt-10 space-y-4 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
              Deep local market knowledge across Nova Scotia
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
              Honest advice backed by real market data
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
              Buyer-first approach — no pressure, no gimmicks
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
              Access to off-market & early opportunities
            </li>
          </ul>

          {/* CTA */}
        <div className="mt-12">
  <button className="group inline-flex items-center gap-3 rounded-full bg-red-600 px-10 py-4 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg">
    Contact Us

    {/* Arrow */}
    <span className="inline-block transform transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  </button>
</div>

        </div>

      {/* RIGHT – TRUST CARDS */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
  {[
    {
      title: "Local Market Expertise",
      desc: "Hyper-local insights into neighbourhood pricing, demand trends, and future growth areas across Nova Scotia.",
    },
    {
      title: "Data-Driven Guidance",
      desc: "Every recommendation is backed by real sales data, market analytics, and comparable property insights.",
    },
    {
      title: "Buyer Advocacy",
      desc: "Your goals come first — from negotiation strategy to protecting your long-term investment value.",
    },
    {
      title: "End-to-End Support",
      desc: "From first showing to closing day, you’re guided at every step with clarity and confidence.",
    },
  ].map((item) => (
    <div
      key={item.title}
      className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
    >
      {/* Accent Line */}
      <span className="absolute left-0 top-6 h-12 w-[3px] bg-red-600 rounded-full opacity-80" />

      {/* Content */}
      <h4 className="ml-4 text-lg font-semibold text-[#091D35] transition group-hover:text-red-600">
        {item.title}
      </h4>

      <p className="ml-4 mt-3 text-sm leading-relaxed text-gray-600">
        {item.desc}
      </p>
    </div>
  ))}
</div>

      </div>
    </section>
  );
}
