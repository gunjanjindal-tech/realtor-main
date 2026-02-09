"use client";

import emailjs from "@emailjs/browser";

export default function PremiumBuyerCTA() {

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_htw20yg",        // ✅ Akshay wali service
        "template_a9plgpb",       // ✅ Same template
        e.target,
        "3TSO2_ucamBQ2Dksn"       // ✅ Public key
      )
      .then(() => {
        alert("Request sent successfully!");
        e.target.reset();
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to send request");
      });
  };

  return (
    <section className="relative overflow-hidden bg-[#0B1F3A] py-32">
      {/* subtle background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.06),transparent_40%)]" />

      <div className="relative mx-auto max-w-[1600px] px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">

          {/* LEFT – STATEMENT */}
          <div className="text-white">
            <span className="text-sm font-semibold uppercase tracking-widest text-white/50">
              Buying in Nova Scotia
            </span>

            <h2 className="mt-5 max-w-xl text-5xl font-extrabold leading-tight">
              Buy with Confidence. <br />
              Invest with Insight.
            </h2>

            <div className="mt-6 h-[3px] w-24 bg-red-600" />

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
              Nova Scotia is more than a destination — it’s a lifestyle and a
              long-term investment. We guide buyers through every step with
              local expertise, market intelligence, and access others don’t
              have.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div>
                <p className="text-3xl font-bold">Local</p>
                <p className="mt-1 text-sm text-white/60">
                  Neighborhood-level expertise
                </p>
              </div>

              <div>
                <p className="text-3xl font-bold">Strategic</p>
                <p className="mt-1 text-sm text-white/60">
                  Data-backed buying decisions
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT – PREMIUM ACTION CARD */}
          <div className="relative rounded-3xl bg-white p-12 shadow-2xl">
            <h3 className="text-2xl font-bold text-[#091D35]">
              Get Curated Homes — Not Endless Listings
            </h3>

            <p className="mt-3 max-w-md text-sm text-gray-600">
              Share a few details and receive hand-picked properties aligned
              with your goals, lifestyle, and budget.
            </p>

            {/* ✅ FORM START (UI SAME) */}
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Preferred City or Community"
                className="w-full rounded-xl border border-gray-300 px-5 py-4 text-sm focus:border-[#091D35] focus:outline-none"
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full rounded-xl border border-gray-300 px-5 py-4 text-sm focus:border-[#091D35] focus:outline-none"
                required
              />

              {/* hidden fields for template compatibility */}
              <input type="hidden" name="phone" value="N/A" />
              <textarea name="message" className="hidden" defaultValue="Buyer requested private listings" />

              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-[#091D35] py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-black"
              >
                Request Private Listings
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              No spam. No pressure. Just strategic guidance.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}