import ContactHero from "@/components/contact/ContactHero";
import ContactLeft from "@/components/contact/ContactLeft";
import ContactForm from "@/components/contact/ContactForm";

export default function ContactPage() {
  return (
    <>
      <ContactHero />

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-20 px-6 lg:grid-cols-2 items-start">
          {/* LEFT */}
          <ContactLeft />

          {/* RIGHT */}
          <ContactForm />
        </div>
      </section>
    </>
  );
}
