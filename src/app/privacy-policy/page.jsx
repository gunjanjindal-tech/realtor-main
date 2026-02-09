export const metadata = {
  title: "Privacy Policy | The Realtor",
  description:
    "Learn how we collect, use, and protect your personal information on our real estate website.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="bg-[#091D35] pt-36 pb-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Legal
          </span>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-white">
            Privacy Policy
          </h1>

          <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-white/70">
            This policy explains how we collect, use, and protect your personal
            information when you use our website.
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto w-full max-w-[1400px] px-6 xl:px-10 2xl:px-0">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">

              {/* Content Card */}
              <div className="rounded-2xl bg-white shadow-lg p-8 md:p-12 space-y-12 text-gray-700">

                <p className="text-base md:text-lg 2xl:text-xl leading-relaxed">
                  Your privacy is important to us. This Privacy Policy outlines
                  how we collect, use, store, and protect personal information
                  provided by visitors to our website.
                </p>

                <PolicySection title="Information We Collect">
                  <ul className="list-disc list-inside space-y-3">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Property preferences or inquiries</li>
                    <li>Information submitted through contact or inquiry forms</li>
                  </ul>
                </PolicySection>

                <PolicySection title="How We Use Your Information">
                  <ul className="list-disc list-inside space-y-3">
                    <li>Responding to inquiries and providing services</li>
                    <li>Sharing relevant property information</li>
                    <li>Improving website performance and user experience</li>
                    <li>Marketing communications (where consent is provided)</li>
                  </ul>
                </PolicySection>

                <PolicySection title="Cookies & Tracking Technologies">
                  <p>
                    We use cookies and similar technologies to enhance user
                    experience, analyze website traffic, and support marketing
                    activities. Please review our{" "}
                    <a
                      href="/cookies-policy"
                      className="font-semibold text-[#091D35] underline underline-offset-4"
                    >
                      Cookies Policy
                    </a>{" "}
                    for more information.
                  </p>
                </PolicySection>

                <PolicySection title="Sharing of Information">
                  <p>
                    We do not sell or rent your personal information. Data may be
                    shared only with trusted service providers when required to
                    deliver services or comply with legal obligations.
                  </p>
                </PolicySection>

                <PolicySection title="Data Security">
                  <p>
                    We implement reasonable safeguards to protect personal
                    information. However, no method of online transmission or
                    storage is completely secure.
                  </p>
                </PolicySection>

                <PolicySection title="Your Rights">
                  <p>
                    You may request access to, correction of, or deletion of your
                    personal information by contacting us directly.
                  </p>
                </PolicySection>

                <PolicySection title="Policy Updates">
                  <p>
                    This Privacy Policy may be updated periodically to reflect
                    changes in legal or business requirements. Updates will be
                    posted on this page.
                  </p>
                </PolicySection>

                <PolicySection title="Contact Information">
                  <p>
                    If you have any questions regarding this Privacy Policy,
                    please contact us at{" "}
                    <a
                      href="mailto:info@therealtor.ca"
                      className="font-semibold text-[#091D35] underline underline-offset-4"
                    >
                      info@therealtor.ca
                    </a>
                    .
                  </p>
                </PolicySection>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* Reusable Section Component */
function PolicySection({ title, children }) {
  return (
    <div>
      <h2 className="text-2xl md:text-2xl 2xl:text-3xl font-bold text-[#091D35]">
        {title}
      </h2>

      <div className="mt-4 text-sm md:text-base 2xl:text-xl leading-relaxed">
        {children}
      </div>
    </div>
  );
}
