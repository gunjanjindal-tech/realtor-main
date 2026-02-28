"use client";

export default function PropertyTabs() {
  return (
    <section className="border-b bg-white">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center gap-10 text-sm font-medium">
          <Tab active label="Overview" />
          <Tab label="Features & Amenities" />
          <Tab label="Lifestyle Index" />

          <div className="ml-auto flex gap-4">
            <button className="rounded-full border px-6 py-2 text-sm">
              Get in Touch
            </button>
            <button className="rounded-full bg-[#0A1F44] text-white px-6 py-2">
              Schedule a Tour
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tab({ label, active }) {
  return (
    <button
      className={`py-4 border-b-2 ${
        active
          ? "border-[#0A1F44] text-[#0A1F44]"
          : "border-transparent text-gray-500 hover:text-[#0A1F44]"
      }`}
    >
      {label}
    </button>
  );
}
