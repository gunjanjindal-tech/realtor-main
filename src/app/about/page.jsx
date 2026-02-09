"use client";

import { useState } from "react";

/* ================= IMPORTS ================= */
import AboutHero from "@/components/about/AboutHero";
import AboutStory from "@/components/about/AboutStory";
import AboutServices from "@/components/about/AboutServices";
import AboutLocalExpertise from "@/components/about/AboutLocalExpertise";
import AboutMissionValues from "@/components/about/AboutMissionValues";
import AboutDifferentiator from "@/components/about/AboutDifferentiator";
import AboutFAQ from "@/components/about/AboutFAQ";
import AboutPremiumCTA from "@/components/about/AboutPremiumCTA";

export default function AboutPage() {
  const services = [
    {
      title: "Residential Sales",
      text: "Expert guidance for buying and selling homes with confidence.",
      img: "https://images.unsplash.com/photo-1650073475221-042960a60883?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "New Developments",
      text: "Strategic planning and execution for builders and developers.",
      img: "https://images.unsplash.com/photo-1688307193832-a6f711942705?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Market Advisory",
      text: "Data-driven insights to support smarter decisions.",
      img: "https://images.unsplash.com/photo-1645406310264-de3fd67ae341?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Investment Consulting",
      text: "Long-term strategies for real estate investors.",
      img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Luxury Properties",
      text: "Premium marketing and representation for high-end homes.",
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    },
  ];

  const [activeBg, setActiveBg] = useState(services[0].img);

  return (
    <main className="bg-white text-[#0b1f3a] overflow-x-hidden scroll-smooth">

      {/* HERO */}
      <AboutHero />

      {/* OUR STORY + FOUNDER + VALUES */}
      <AboutStory services={services} />

      {/* WHAT WE DO */}
      <AboutServices
        services={services}
        activeBg={activeBg}
        setActiveBg={setActiveBg}
      />

      {/* OTHER SECTIONS */}
      <AboutLocalExpertise />
      <AboutMissionValues />
      <AboutDifferentiator />
      <AboutFAQ />
      <AboutPremiumCTA />

    </main>
  );
}
