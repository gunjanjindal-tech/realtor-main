import { Users, Zap, Rocket, ShieldCheck } from "lucide-react";

export default function AboutMissionValues() {
  const values = [
    {
      icon: Users,
      title: "Amplify Together",
      desc: "We succeed as a team. Collaboration and shared growth drive better outcomes.",
    },
    {
      icon: Zap,
      title: "Be Relentless",
      desc: "Focused, disciplined, and committed to delivering real results.",
    },
    {
      icon: Rocket,
      title: "Disrupt for Good",
      desc: "We challenge outdated norms to create smarter, modern solutions.",
    },
    {
      icon: ShieldCheck,
      title: "Built on Trust",
      desc: "Integrity, transparency, and honesty guide every decision we make.",
    },
  ];

  return (
    <section className="bg-[#0B1F3B] py-32">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* SECTION HEADING */}
        <div className="mb-20 max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Our Principles
          </span>

          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight text-white">
            Mission & Values That Guide<br />
             Every Decision
          </h2>

          <div className="mt-5 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-gray-300">
            Our approach is built on trust, strategy, and a relentless focus
            on creating long-term value for every client.
          </p>
        </div>

        {/* VALUES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {values.map((item) => (
            <div
              key={item.title}
              className="
                flex gap-5 p-8 rounded-2xl
                bg-white
                border border-white/10
                hover:-translate-y-1 hover:shadow-2xl
                transition-all duration-300
              "
            >
              <item.icon className="h-7 w-7 text-[rgb(229,14,11)] shrink-0" />

              <div>
                <h3 className="text-lg font-semibold text-[#091D35]">
                  {item.title}
                </h3>

                <p className="mt-2 text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
