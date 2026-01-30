export const metadata = {
  title: "Accessibility | The Realtor",
  description:
    "Our commitment to digital accessibility and inclusive user experience for all visitors.",
};

export default function AccessibilityPage() {
  return (
    <>
      {/* HERO SECTION (same as Contact style) */}
      <section className="bg-[#091D35] pt-36 pb-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Accessibility
          </span>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-white">
            Accessibility Statement
          </h1>

          <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-white/70">
            We are committed to providing an accessible and inclusive experience
            for all users.
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto w-full max-w-[1400px] px-6 xl:px-10 2xl:px-0">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="rounded-2xl bg-white shadow-lg p-8 md:p-12 space-y-12 text-gray-700">

                <PolicySection title="Our Commitment">
                  <p>
                    The Realtor is committed to ensuring digital accessibility
                    for people of all abilities. We strive to continuously
                    improve the user experience for everyone and apply relevant
                    accessibility standards wherever possible.
                  </p>
                </PolicySection>

                <PolicySection title="Accessibility Standards">
                  <p>
                    This website aims to conform with the Web Content
                    Accessibility Guidelines (WCAG) 2.1 Level AA, which are
                    internationally recognized standards for accessibility and
                    align with Canadian accessibility expectations.
                  </p>
                </PolicySection>

                <PolicySection title="Accessibility Features">
                  <ul className="list-disc list-inside space-y-3">
                    <li>Keyboard navigability</li>
                    <li>Readable font sizes and sufficient color contrast</li>
                    <li>Clear headings and structured content</li>
                    <li>Accessible forms and labels</li>
                    <li>Responsive design for mobile and tablet devices</li>
                  </ul>
                </PolicySection>

                <PolicySection title="Assistive Technology Support">
                  <p>
                    This website is designed to be compatible with commonly used
                    assistive technologies such as screen readers, screen
                    magnifiers, and voice recognition software.
                  </p>
                </PolicySection>

                <PolicySection title="Third-Party Accessibility Tools">
                  <p>
                    We may use third-party accessibility tools (such as
                    accessibility widgets) to further enhance usability. These
                    tools are intended to support — not replace — built-in
                    accessibility best practices.
                  </p>
                </PolicySection>

                <PolicySection title="Ongoing Improvements">
                  <p>
                    Accessibility is an ongoing effort. We regularly review our
                    website and make updates to improve accessibility and
                    usability for all visitors.
                  </p>
                </PolicySection>

                <PolicySection title="Feedback & Assistance">
                  <p>
                    If you experience any difficulty accessing content on this
                    website or have suggestions for improvement, please contact
                    us. We welcome your feedback and will do our best to assist
                    you.
                  </p>

                  <p className="mt-4">
                    Email us at{" "}
                    <a
                      href="mailto:info@therealtor.ca"
                      className="font-semibold text-[#091D35] underline underline-offset-4"
                    >
                      info@therealtor.ca
                    </a>
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
