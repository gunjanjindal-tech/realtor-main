"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Google Maps (no SSR)
const MapClient = dynamic(
  () => import("./PropertyListingsMapGoogle"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-2">Loading map...</p>
          <div className="w-8 h-8 border-4 border-[#091d35] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    ),
  }
);

export default function PropertyListingsMap({ listings = [], onBoundsChange }) {
  const [mounted, setMounted] = useState(false);

  // Filter listings with valid coordinates from Bridge API
  const validListings = useMemo(() => {
    return listings.filter(
      (listing) => {
        const lat = listing.Latitude || listing.LatitudeDecimal;
        const lng = listing.Longitude || listing.LongitudeDecimal;
        return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
      }
    );
  }, [listings]);

  // Calculate center point from all Bridge API coordinates
  const mapCenter = useMemo(() => {
    if (validListings.length === 0) {
      return { lat: 44.6488, lng: -63.5752 }; // Default: Halifax, NS
    }

    // Calculate average center from all properties
    let totalLat = 0;
    let totalLng = 0;
    
    validListings.forEach((listing) => {
      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
      if (!isNaN(lat) && !isNaN(lng)) {
        totalLat += lat;
        totalLng += lng;
      }
    });

    return {
      lat: totalLat / validListings.length,
      lng: totalLng / validListings.length,
    };
  }, [validListings]);

  // Ensure component only renders on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-2">Loading map...</p>
          <div className="w-8 h-8 border-4 border-[#091d35] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full relative bg-gray-100" 
      style={{ 
        minHeight: '400px', 
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <MapClient
        listings={validListings}
        mapCenter={mapCenter}
        onBoundsChange={onBoundsChange}
      />
    </div>
  );
}

