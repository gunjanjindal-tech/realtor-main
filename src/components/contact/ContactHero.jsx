export default function ContactHero() {
  return (
    <section className="bg-[#091D35] pt-36 pb-24 text-center">
      <div className="mx-auto max-w-3xl px-6">

        <span className="text-sm font-semibold uppercase tracking-widest text-white/60">
          Contact
        </span>

        <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-white">
          Let’s Start a Conversation
        </h1>

        {/* RED UNDERLINE */}
        <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

        <p className="mt-6 text-lg text-white/70">
          Honest, data-driven real estate guidance — no pressure, no spam.
        </p>

      </div>
    </section>
  );
}
