"use client";
import { useState } from "react";

export default function AboutDifferentiator() {
  const [isHovering, setIsHovering] = useState(false);

  const points = [
    {
      title: "Data-Driven Strategy",
      desc: "Pricing and positioning backed by real market data, not guesswork.",
    },
    {
      title: "Zero Pressure Guidance",
      desc: "Honest advice that puts your long-term interests first.",
    },
    {
      title: "Investor Mindset",
      desc: "Every decision optimized for growth, equity, and future value.",
    },
    {
      title: "Modern Marketing",
      desc: "High-impact digital marketing powered by analytics and insight.",
    },
  ];

  return (
    <section className="py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

        {/* LEFT */}
        <div>
          {/* HEADING */}
          <div className="mb-12 max-w-3xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              Our Advantage
            </span>

            <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight text-[#091D35]">
              What Truly Sets  Us Apart
            </h2>

            <div className="mt-5 h-[3px] w-24 bg-red-600" />
          </div>

          {/* POINTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {points.map((item) => (
              <div
                key={item.title}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="
                  group border border-gray-200 rounded-xl p-6
                  hover:border-red-600 hover:shadow-lg
                  transition-all duration-300
                "
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full
                    bg-red-100 text-red-600 font-bold">
                    ✓
                  </span>

                  <h4 className="font-semibold text-lg group-hover:text-red-600 transition">
                    {item.title}
                  </h4>
                </div>

                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT – REACTS ON LEFT HOVER */}
        <div className="lg:mt-[200px]">
          <div
            className={`
              rounded-2xl bg-[#091D35] p-12 text-white
              flex flex-col justify-center
              transition-all duration-300
              ${isHovering ? "-translate-y-2 shadow-2xl" : ""}
            `}
          >
            <p className="text-xl leading-relaxed font-light">
              We don’t chase transactions.
              <br />
              <span className="font-semibold">
                We build trust, guide smart decisions,
              </span>{" "}
              and deliver clarity at every stage of your real estate journey.
            </p>

            {/* RED LINE EFFECT */}
            <div
              className={`
                mt-8 h-[2px] bg-red-600 transition-all duration-300
                ${isHovering ? "w-24" : "w-16"}
              `}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
