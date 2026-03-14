"use client";

import { useMemo, memo } from "react";
import dynamic from "next/dynamic";

// Google Maps (no SSR) - optimized loading with eager loading
const MapClient = dynamic(
  () => import("./PropertyListingsMapGoogle"),
  {
    ssr: false,
    loading: () => null, // No loading spinner - faster perceived load
    // Load map only when needed (when viewMode is map or split)
  }
);

export default memo(function PropertyListingsMap({ listings = [], onBoundsChange, searchQuery, hasSearchResults = false, onMapClick, onZoomChange, listingType = "sale" }) {
  // Filter listings with valid coordinates from Bridge API - optimized
  const validListings = useMemo(() => {
    if (listings.length === 0) return [];

    const filtered = [];
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const lat = listing.Latitude || listing.LatitudeDecimal;
      const lng = listing.Longitude || listing.LongitudeDecimal;
      if (lat && lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (!isNaN(latNum) && !isNaN(lngNum) &&
          latNum >= -90 && latNum <= 90 &&
          lngNum >= -180 && lngNum <= 180) {
          filtered.push(listing);
        }
      }
    }

    return filtered;
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
        touchAction: 'pan-y pinch-zoom' // Allow map gestures on mobile
      }}
      suppressHydrationWarning
    >
      {validListings.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            {listings.length === 0 ? (
              <>
                <p className="text-gray-500 mb-2">Loading properties...</p>
                <div className="w-8 h-8 border-4 border-[#091d35] border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-2">No properties with location data</p>
                <p className="text-sm text-gray-400">
                  {listings.length} properties found, but none have coordinates
                </p>
                {process.env.NODE_ENV === "development" && (
                  <p className="text-xs text-gray-400 mt-2">
                    Check API response for Latitude/Longitude fields
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <MapClient
          listings={validListings}
          mapCenter={mapCenter}
          bounds={mapCenter.bounds}
          onBoundsChange={onBoundsChange}
          searchQuery={searchQuery}
          hasSearchResults={hasSearchResults}
          onMapClick={onMapClick}
          onZoomChange={onZoomChange}
          listingType={listingType}
        />
      )}
    </div>
  );
});