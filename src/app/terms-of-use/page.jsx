export const metadata = {
  title: "Terms of Use | The Realtor",
  description:
    "Terms and conditions governing the use of The Realtor website and services.",
};

export default function TermsOfUsePage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="bg-[#091D35] pt-36 pb-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <span className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Legal
          </span>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-white">
            Terms of Use
          </h1>

          <div className="mx-auto mt-6 h-[3px] w-24 bg-red-600" />

          <p className="mt-6 text-lg text-white/70">
            Please review these terms carefully before using our website.
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
                  These Terms of Use govern your access to and use of The Realtor
                  website. By accessing or using this website, you agree to be
                  bound by these terms. If you do not agree, please refrain from
                  using the website.
                </p>

                <PolicySection title="Use of Website">
                  <p>
                    This website is provided for informational purposes only.
                    You agree to use the website lawfully and not engage in any
                    activity that could harm, disrupt, or interfere with its
                    operation.
                  </p>
                </PolicySection>

                <PolicySection title="No Professional Advice">
                  <p>
                    The information provided on this website does not constitute
                    legal, financial, or real estate advice. While we strive to
                    keep information accurate and up to date, market conditions
                    and property details may change without notice.
                  </p>
                </PolicySection>

                <PolicySection title="Listings & Property Information">
                  <p>
                    Property listings and related information are subject to
                    availability, errors, omissions, and changes without notice.
                    We do not guarantee the accuracy or completeness of any
                    listing information displayed on this website.
                  </p>
                </PolicySection>

                <PolicySection title="Third-Party Services & Links">
                  <p>
                    This website may include links to third-party websites or
                    services (such as scheduling tools or map services). We are
                    not responsible for the content, policies, or practices of
                    any third-party services.
                  </p>
                </PolicySection>

                <PolicySection title="Intellectual Property">
                  <p>
                    All content on this website, including text, images, logos,
                    and design elements, is the property of The Realtor or its
                    licensors and may not be reproduced, distributed, or used
                    without prior written permission.
                  </p>
                </PolicySection>

                <PolicySection title="Limitation of Liability">
                  <p>
                    To the fullest extent permitted by law, The Realtor shall
                    not be liable for any damages arising from the use or
                    inability to use this website, including but not limited to
                    direct, indirect, incidental, or consequential damages.
                  </p>
                </PolicySection>

                <PolicySection title="Privacy & Cookies">
                  <p>
                    Your use of this website is also governed by our{" "}
                    <a
                      href="/privacy-policy"
                      className="font-semibold text-[#091D35] underline underline-offset-4"
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="/cookies-policy"
                      className="font-semibold text-[#091D35] underline underline-offset-4"
                    >
                      Cookies Policy
                    </a>
                    .
                  </p>
                </PolicySection>

                <PolicySection title="Changes to These Terms">
                  <p>
                    We may update these Terms of Use from time to time to reflect
                    changes in legal requirements or website functionality.
                    Updated terms will be posted on this page.
                  </p>
                </PolicySection>

                <PolicySection title="Contact Information">
                  <p>
                    If you have any questions regarding these Terms of Use,
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
