"use client";

import { useEffect } from "react";

export default function AnalyticsLoader() {
  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");

    if (consent === "accepted") {
      // Load Google Analytics ONLY after consent
      const script = document.createElement("script");
      script.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      gtag("js", new Date());
      gtag("config", "G-XXXXXXX");
    }
  }, []);

  return null;
}
