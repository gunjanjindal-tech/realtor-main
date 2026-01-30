"use client";

import { useEffect } from "react";

export default function AccessibilityWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.userway.org/widget.js";
    script.setAttribute("data-account", "YOUR_USERWAY_ACCOUNT_ID");
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
