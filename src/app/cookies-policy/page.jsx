export const metadata = {
  title: "Cookies Policy | The Realtor",
  description:
    "Learn how cookies are used on our website and how you can manage your preferences.",
};

export default function CookiesPolicyPage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="bg-[#091D35] pt-36 pb-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Legal
          </span>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-white">
            Cookies Policy
          </h1>

          <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-white/70">
            This policy explains how cookies are used on our website and how you
            can manage your preferences.
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto w-full max-w-[1400px] px-6 xl:px-10 2xl:px-0">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="rounded-2xl bg-white shadow-lg p-8 md:p-12 space-y-12 text-gray-700">

                <PolicySection title="What Are Cookies?">
                  <p>
                    Cookies are small text files that are stored on your device
                    when you visit a website. They help websites function
                    properly, improve performance, and provide insights into how
                    visitors use the site.
                  </p>
                </PolicySection>

                <PolicySection title="How We Use Cookies">
                  <ul className="list-disc list-inside space-y-3">
                    <li>To ensure the website functions correctly</li>
                    <li>To improve user experience and site performance</li>
                    <li>To understand how visitors interact with our website</li>
                    <li>To support marketing and advertising efforts</li>
                  </ul>
                </PolicySection>

                <PolicySection title="Types of Cookies We Use">
                  <ul className="list-disc list-inside space-y-3">
                    <li>
                      <strong>Essential Cookies:</strong> Required for core
                      functionality such as navigation, security, and form
                      submissions.
                    </li>
                    <li>
                      <strong>Analytics Cookies:</strong> Help us understand site
                      traffic and improve website performance.
                    </li>
                    <li>
                      <strong>Marketing Cookies:</strong> Used to deliver
                      relevant ads and measure campaign effectiveness.
                    </li>
                    <li>
                      <strong>Third-Party Cookies:</strong> Set by external
                      services such as maps, scheduling tools, or embedded media.
                    </li>
                  </ul>
                </PolicySection>

                <PolicySection title="Managing Your Cookie Preferences">
                  <p>
                    You can manage or change your cookie preferences at any time
                    using the cookie consent banner on our website or through
                    your browser settings. Blocking certain cookies may affect
                    site functionality.
                  </p>
                </PolicySection>

                <PolicySection title="Consent">
                  <p>
                    By continuing to use our website after accepting cookies,
                    you consent to the use of cookies in accordance with this
                    policy.
                  </p>
                </PolicySection>

                <PolicySection title="Policy Updates">
                  <p>
                    This Cookies Policy may be updated from time to time to
                    reflect changes in legal requirements or website practices.
                    Updates will be posted on this page.
                  </p>
                </PolicySection>

                <PolicySection title="Contact Information">
                  <p>
                    If you have any questions about this Cookies Policy, please
                    contact us at{" "}
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
