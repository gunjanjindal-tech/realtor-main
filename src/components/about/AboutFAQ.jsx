"use client";

import { useState } from "react";

export default function AboutFAQ() {
  const faqs = [
    {
      q: "What areas do you serve?",
      a: "We primarily serve Nova Scotia, with a deep focus on Halifax and surrounding communities.",
    },
    {
      q: "Do you work with first-time buyers?",
      a: "Absolutely. We guide first-time buyers step by step, ensuring clarity and confidence throughout the process.",
    },
    {
      q: "How is THE REALTOR different?",
      a: "We combine local expertise, data-driven strategy, and transparent communication to deliver long-term value.",
    },
    {
      q: "Do you handle luxury and investment properties?",
      a: "Yes. From luxury homes to long-term investment opportunities, our strategies are tailored to your goals.",
    },
  ];

  const [open, setOpen] = useState(null);

  return (
    <section className="bg-white py-18">
      <div className="mx-auto max-w-5xl px-6">

        {/* HEADING */}
        <div className="mb-16 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Common Questions
          </span>

          <h2 className="mt-3 text-4xl font-extrabold text-[#091D35]">
            Frequently Asked Questions
          </h2>

          <div className="mt-4 h-[3px] w-24 bg-red-600" />
        </div>

        {/* FAQ LIST */}
        <div className="space-y-6">
          {faqs.map((item, i) => {
            const isOpen = open === i;

            return (
              <div
                key={i}
                className="
                  group rounded-2xl border border-gray-200 bg-white
                  transition-all duration-300
                  hover:border-red-500 hover:shadow-lg
                "
              >
                <button
  onClick={() => setOpen(isOpen ? null : i)}
  className="
    flex w-full items-center justify-between px-6 py-5 text-left
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-red-500
    focus-visible:ring-offset-2
    focus-visible:ring-offset-white
  "
>

                  <span className="text-lg font-semibold text-[#091D35]">
                    {item.q}
                  </span>

                  <span
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full
                      bg-red-100 text-red-600 text-xl font-bold
                      transition-transform duration-300
                      ${isOpen ? "rotate-45" : ""}
                    `}
                  >
                    +
                  </span>
                </button>

                <div
                  className={`
                    grid transition-all duration-300 ease-in-out
                    ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
                  `}
                >
                  <div className="overflow-hidden px-6 ">
                    <p className="mt-2 text-gray-600 leading-relaxed pb-2">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
