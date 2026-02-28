"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Google Maps (no SSR) - optimized loading
const MapClient = dynamic(
  () => import("./PropertyListingsMapGoogle"),
  {
    ssr: false,
    // Optimize: minimal loading state
    loading: () => null,
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

  // Calculate center point and bounds from all Bridge API coordinates
  const mapCenter = useMemo(() => {
    if (validListings.length === 0) {
      return { lat: 44.6488, lng: -63.5752 }; // Default: Halifax, NS
    }

    // Calculate bounds to fit all properties
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    validListings.forEach((listing) => {
      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
      if (!isNaN(lat) && !isNaN(lng)) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    });

    // Calculate center from bounds
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    return {
      lat: centerLat,
      lng: centerLng,
      bounds: validListings.length > 1 ? {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng,
      } : null,
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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none' // Prevent scrolling on map container
      }}
      suppressHydrationWarning
    >
      {validListings.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No properties with location data</p>
            <p className="text-sm text-gray-400">Map will appear when properties are available</p>
          </div>
        </div>
      ) : (
        <MapClient
          listings={validListings}
          mapCenter={mapCenter}
          onBoundsChange={onBoundsChange}
        />
      )}
    </div>
  );
}