export default function ContactForm() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-2xl">
      <div className="grid grid-cols-2 gap-6">
        <input className="input" placeholder="First Name" />
        <input className="input" placeholder="Last Name" />
        <input className="input" placeholder="Email" />
        <input className="input" placeholder="Phone" />
      </div>

      <select className="input mt-6">
        <option>What are you looking for?</option>
        <option>Buying</option>
        <option>Selling</option>
        <option>Investing</option>
        <option>Relocation</option>
      </select>

      <textarea
        className="input mt-6 h-32"
        placeholder="Tell us about your goals"
      />

      <button className="mt-8 w-full rounded-full bg-[#091D35] py-4 text-sm font-semibold text-white hover:bg-black transition">
        Send Message
      </button>

      <p className="mt-4 text-center text-xs text-gray-500">
        No spam. No pressure. Just honest guidance.
      </p>
    </div>
  );
}
