"use client";

import { useMemo, memo } from "react";
import dynamic from "next/dynamic";
import { Map } from "lucide-react";

// Google Maps (no SSR) - optimized loading with eager loading
const MapClient = dynamic(
  () => import("./PropertyListingsMapGoogle"),
  {
    ssr: false,
    loading: () => null, // No loading spinner - faster perceived load
    // Load map only when needed (when viewMode is map or split)
  }
);

export default memo(function PropertyListingsMap({ 
  listings = [], 
  onBoundsChange, 
  searchQuery, 
  hasSearchResults = false, 
  onMapClick, 
  onZoomChange, 
  listingType = "sale",
  loading = false 
}) {
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
          <div className="text-center px-4">
            {loading ? (
              <>
                <p className="text-gray-500 mb-2 font-medium text-lg">Loading properties...</p>
                <div className="w-10 h-10 border-4 border-[#091d35] border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
              </>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md mx-auto transform transition-all animate-fadeIn">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[#091d35] font-bold text-xl mb-2">No locations found</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {listings.length === 0 
                    ? "We couldn't find any properties matching your current search and filters."
                    : `We found ${listings.length} properties, but none of them have valid map coordinates to display.`}
                </p>
                {searchQuery && (
                  <p className="mt-4 text-xs font-semibold text-red-600 uppercase tracking-wider">
                    Searching for: "{searchQuery}"
                  </p>
                )}
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-2 bg-[#091d35] text-white text-sm font-semibold rounded-full hover:bg-red-600 transition-colors duration-300"
                >
                  Reset Search
                </button>
              </div>
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