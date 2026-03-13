"use client";

export default function ScheduleTourCard() {
   
    return (
      
    <div className="rounded-3xl bg-gradient-to-br from-[#061A33] to-[#0B2A52] p-8 text-white shadow-2xl">
      
      <h3 className="text-2xl font-extrabold">
        Request a Private Tour
      </h3>

      <p className="mt-2 text-sm text-white/80">
        Explore this property with a trusted local expert.
      </p>

      {/* DATE MOCK (visual only for now) */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {["Tue", "Wed", "Thu"].map((day, i) => (
          <div
            key={day}
            className="rounded-xl border border-white/20 py-4 text-center"
          >
            <p className="text-xs uppercase text-white/70">{day}</p>
            <p className="text-3xl font-bold">{String(3 + i).padStart(2, "0")}</p>
            <p className="text-xs text-white/60">Feb</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href="https://akshay42hj.setmore.com"
        target="_blank"
        rel="noopener noreferrer"
className="mt-6 flex items-center justify-center gap-2 
rounded-full bg-red-600 px-4 py-3 
text-sm font-semibold text-white 
hover:bg-red-700 transition"      >
        Schedule a Meeting
      </a>

      <p className="mt-3 text-xs text-center text-white/60">
        No pressure • No spam • Private consultation
      </p>
    </div>
  );
}
