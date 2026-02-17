"use client";

import emailjs from "@emailjs/browser";

export default function ContactForm() {
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
          alert("Message sent successfully!");
          e.target.reset();
        },
        (error) => {
          if (process.env.NODE_ENV === "development") {
            console.error(error);
          }
          alert("Failed to send message");
        }
      );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-gray-200 bg-white p-10 shadow-2xl"
    >
      <div className="grid grid-cols-2 gap-6">
        <input
          name="name"
          className="input"
          placeholder="First Name"
          required
        />

        <input
          name="last_name"
          className="input"
          placeholder="Last Name"
        />

        <input
          name="email"
          type="email"
          className="input"
          placeholder="Email"
          required
        />

        <input
          name="phone"
          className="input"
          placeholder="Phone"
        />
      </div>

      <select name="interest" className="input mt-6">
        <option>What are you looking for?</option>
        <option>Buying</option>
        <option>Selling</option>
        <option>Investing</option>
        <option>Relocation</option>
      </select>

      <textarea
        name="message"
        className="input mt-6 h-32"
        placeholder="Tell us about your goals"
        required
      />

      <button
        type="submit"
        className="mt-8 w-full rounded-full bg-[#091D35] py-4 text-sm font-semibold text-white hover:bg-black transition"
      >
        Send Message
      </button>

      <p className="mt-4 text-center text-xs text-gray-500">
        No spam. No pressure. Just honest guidance.
      </p>
    </form>
  );
}