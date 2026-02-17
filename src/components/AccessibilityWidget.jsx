"use client";

import { useEffect } from "react";

export default function AccessibilityWidget() {
  useEffect(() => {
    // Only load UserWay widget if account ID is configured
    const accountId = "YOUR_USERWAY_ACCOUNT_ID";
    
    // Skip loading if account ID is not configured
    if (!accountId || accountId === "YOUR_USERWAY_ACCOUNT_ID") {
      return;
    }

    // Check if widget is already loaded
    if (document.querySelector('script[src*="userway.org"]')) {
      return;
    }

    try {
      const script = document.createElement("script");
      script.src = "https://cdn.userway.org/widget.js";
      script.setAttribute("data-account", accountId);
      script.async = true;
      
      // Add error handling
      script.onerror = () => {
        if (process.env.NODE_ENV === "development") {
          console.warn("UserWay widget failed to load");
        }
      };

      document.body.appendChild(script);

      return () => {
        // Safely remove script on cleanup
        const scriptElement = document.querySelector('script[src*="userway.org"]');
        if (scriptElement && scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
        }
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Error loading UserWay widget:", error);
      }
    }
  }, []);

  return null;
}
