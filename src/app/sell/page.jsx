"use client";

import { useRef, useState } from "react";
import WhyNovaScotia from "@/components/WhyNovaScotia";
import BuyerTrustCTA from "@/components/BuyerTrustCTA";
import emailjs from "@emailjs/browser";

export default function SellPage() {

  const valuationRef = useRef(null);
  const [success, setSuccess] = useState(false);

  const scrollToValuation = () => {
    valuationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_htw20yg",
        "template_a9plgpb",
        e.target,
        "3TSO2_ucamBQ2Dksn"
      )
      .then(
        () => {
          setSuccess(true);
          e.target.reset();
          setTimeout(() => setSuccess(false), 4000);
        },
        (error) => {
          console.error(error);
          alert("Failed to send request");
        }
      );
  };

  return (
    <main className="bg-white">

      {/* ================= HERO ================= */}
      <section className="relative bg-[#091D35] text-white">
        <div className="max-w-[1600px] mx-auto px-6 py-32 grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}
          <div>
            <p className="text-red-500 tracking-widest uppercase text-sm">
              Luxury Property Selling
            </p>

            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-[1.05]">
              Sell Your Home For Its <br /> True Market Value
            </h1>

            <p className="mt-6 text-lg text-gray-300 max-w-xl leading-relaxed">
              Strategic pricing, elite marketing exposure, and expert negotiation —
              designed to protect your equity and maximize your return.
            </p>

            {/* BUTTONS */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={scrollToValuation}
                className="bg-red-600 hover:bg-red-700 px-7 py-3.5 rounded-xl font-semibold transition shadow-lg"
              >
                Get Your Home Valuation
              </button>

              <a
                href="https://akshay42hj.setmore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/30 hover:bg-white/10 px-7 py-3.5 rounded-xl font-semibold transition"
              >
                Schedule Consultation
              </a>
            </div>

            {/* ✅ DOT STYLE FEATURES */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-400">
              {[
                "Precision Pricing",
                "Premium Marketing",
                "Negotiation Expertise",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — VALUATION CARD */}
          <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl border border-white/10">

            <h3 className="text-2xl font-bold mb-6">
              Request Property Valuation
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: "address", placeholder: "Property Address" },
                { name: "name", placeholder: "Full Name" },
                { name: "phone", placeholder: "Phone Number" },
                { name: "email", placeholder: "Email Address" },
              ].map((field) => (
                <input
                  key={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-red-500 focus:bg-white/20 transition"
                />
              ))}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 py-3.5 rounded-xl font-semibold transition shadow-lg"
              >
                Request Valuation
              </button>

              {/* ✅ SUCCESS MESSAGE */}
              {success && (
                <p className="text-white text-sm text-center pt-2">
                  Valuation request sent successfully!
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ================= TRUST STRIP ================= */}
      <section className="border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { label: "Transactions", value: "₹120+ Cr" },
            { label: "Homes Sold", value: "350+" },
            { label: "Experience", value: "10+ Years" },
            { label: "Client Satisfaction", value: "5★ Rated" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold text-[#091D35]">
                {item.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= STRATEGY ================= */}
      <section className="py-24">
        <div className="max-w-[1600px] mx-auto px-6">

          <div className="mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#091D35]">
              Our Selling Strategy
            </h2>
            <div className="mt-3 h-[3px] w-24 bg-red-600 rounded-full" />
          </div>

          {/* ✅ PREMIUM RED EFFECT ON HOVER */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Precision Pricing",
              "Cinematic Marketing",
              "Premium Buyer Exposure",
              "Elite Negotiation",
            ].map((title) => (
              <div
                key={title}
                className="
                group
                p-7
                rounded-2xl
                border border-gray-200
                hover:border-red-500
                hover:shadow-xl
                transition
                "
              >
                <h3 className="font-bold text-lg text-[#091D35] group-hover:text-red-600 transition">
                  {title}
                </h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  Data-driven strategy and high-impact marketing designed for
                  maximum property value.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyNovaScotia />

      {/* ================= FAQ (UPGRADED) ================= */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-[1100px] mx-auto px-6">

          <div className="mb-14">
            <h2 className="text-4xl font-extrabold text-[#091D35]">
              Frequently Asked Questions
            </h2>
            <div className="mt-3 h-[3px] w-24 bg-red-600 rounded-full" />
          </div>

          <div className="space-y-5">
            {[
              {
                q: "How is my home valued?",
                a: "We combine live MLS data, hyper-local trends, buyer demand metrics, and property-specific analysis."
              },
              {
                q: "How long does selling typically take?",
                a: "Timelines vary by pricing strategy, market conditions, and buyer activity."
              },
              {
                q: "Will I receive guidance on pricing?",
                a: "Absolutely. Strategic pricing is the single most important factor in maximizing returns."
              },
            ].map((item) => (
              <div
                key={item.q}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition"
              >
                <p className="font-semibold text-[#091D35]">
                  {item.q}
                </p>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <div ref={valuationRef}>
        <BuyerTrustCTA />
      </div>

    </main>
  );
}
