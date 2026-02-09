import ContactHero from "@/components/contact/ContactHero";
import ContactLeft from "@/components/contact/ContactLeft";
import ContactForm from "@/components/contact/ContactForm";
import OfficeLocations from "@/components/contact/OfficeLocations";

export default function ContactPage() {
  return (
    <>
      {/* HERO */}
      <ContactHero />

      {/* TOP: Contact Info + Form */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-2 items-start">
            {/* LEFT */}
            <ContactLeft />

            {/* RIGHT */}
            <ContactForm />
          </div>
        </div>
      </section>

      {/* BOTTOM: Office Locations (FULL WIDTH) */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <OfficeLocations />
        </div>
      </section>
    </>
  );
}
