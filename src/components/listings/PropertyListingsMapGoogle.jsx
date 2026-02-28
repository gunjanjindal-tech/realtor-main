"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";

const MAP_CONTAINER_STYLE = { 
  width: "100%", 
  height: "100%", 
  minHeight: "400px",
  position: "relative"
};

function getStreetNumber(listing) {
  const n = listing.StreetNumber || listing.StreetNumberNumeric;
  if (n != null && String(n).trim() !== "") return String(n).trim();
  const addr = listing.UnparsedAddress || listing.AddressLine1 || "";
  const first = addr.trim().split(/\s+/)[0];
  if (first != null && /^\d+[A-Za-z]?$/.test(first)) return first;
  return null;
}

// Simple dot marker (like reference image) - dark blue dot
const DOT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#091d35" stroke="#ffffff" stroke-width="1.5"/></svg>'
  );

// Home icon as data URL for Google Marker (fallback)
const HOME_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="36" viewBox="0 0 24 28" fill="none" stroke="#091d35" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>'
  );

// City cluster icon - larger dot with count (for city markers)
function createCityIconSVG(count) {
  const countText = count > 99 ? "99+" : count.toString();
  return "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#091d35" stroke="#ffffff" stroke-width="2"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${countText}</text>
      </svg>`
    );
}

const defaultCenter = { lat: 44.6488, lng: -63.5752 };
const ZOOM_CITY_LEVEL = 9; // zoom < this: show only city markers (very zoomed out)
const ZOOM_PROPERTY_LEVEL = 11; // zoom >= this: show all individual properties
// zoom 9-11: show limited properties (sampling) - but default is to show all

// Static libraries array to prevent LoadScript reload warning
const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

export default function PropertyListingsMapGoogle({ listings = [], mapCenter = {}, onBoundsChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedCityKey, setSelectedCityKey] = useState(null);
  const mapRef = useRef(null);

  const apiKey = typeof window !== "undefined" 
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") 
    : "";
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: "weekly",
    preventGoogleFontsLoading: true,
  });

  const validListings = useMemo(
    () =>
      listings.filter((l) => {
        const lat = l.Latitude || l.LatitudeDecimal;
        const lng = l.Longitude || l.LongitudeDecimal;
        return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
      }),
    [listings]
  );

  const cityGroups = useMemo(() => {
    const groups = new Map();
    validListings.forEach((listing) => {
      const cityName = (listing.City || "Other").trim() || "Other";
      const key = cityName.toLowerCase();
      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
      if (isNaN(lat) || isNaN(lng)) return;
      if (!groups.has(key)) {
        groups.set(key, { cityName, listings: [], sumLat: 0, sumLng: 0, count: 0 });
      }
      const g = groups.get(key);
      g.listings.push(listing);
      g.sumLat += lat;
      g.sumLng += lng;
      g.count += 1;
    });
    return Array.from(groups.entries()).map(([key, g]) => ({
      key,
      cityName: g.cityName,
      listings: g.listings,
      center: { lat: g.sumLat / g.count, lng: g.sumLng / g.count },
      count: g.count,
    }));
  }, [validListings]);

  const center = useMemo(
    () => ({ lat: mapCenter?.lat ?? defaultCenter.lat, lng: mapCenter?.lng ?? defaultCenter.lng }),
    [mapCenter]
  );

  const zoom = useMemo(() => {
    if (validListings.length === 0) return 8; // Zoomed out view
    if (validListings.length === 1) return 12; // Single property: moderate zoom
    // For multiple properties, start zoomed out to show city markers
    return 8; // Start zoomed out (shows city markers by default)
  }, [validListings.length]);
  
  // Progressive zoom levels:
  // - Zoom < 9: Only city markers (very zoomed out)
  // - Zoom 9-11: Show limited properties (gradual reveal as you zoom in)
  // - Zoom >= 11: Show ALL individual properties (default view)
  const showCityMarkers = zoomLevel < ZOOM_CITY_LEVEL && validListings.length > 5; // Only show city markers if many properties and very zoomed out
  const showLimitedProperties = zoomLevel >= ZOOM_CITY_LEVEL && zoomLevel < ZOOM_PROPERTY_LEVEL;
  
  // For limited property view, show progressively more properties based on zoom
  // Default: Show ALL properties (e.g., if 15 properties, show all 15)
  const displayedListings = useMemo(() => {
    if (showCityMarkers) return [];
    if (!showLimitedProperties) {
      // Show ALL properties by default (e.g., all 15 properties)
      return validListings;
    }
    
    // Only when zoomed out (9-11), show limited properties that increase as you zoom in
    // Calculate how many properties to show based on zoom level
    // At zoom 9: show fewer (sample)
    // At zoom 11: show all
    const zoomProgress = (zoomLevel - ZOOM_CITY_LEVEL) / (ZOOM_PROPERTY_LEVEL - ZOOM_CITY_LEVEL); // 0 to 1
    const totalToShow = Math.max(
      Math.min(validListings.length, Math.floor(validListings.length * (0.3 + zoomProgress * 0.7))),
      Math.min(validListings.length, 50) // At least show 50 or all if less
    );
    
    // If we have few properties (e.g., 15), show all of them
    if (validListings.length <= 50) {
      return validListings;
    }
    
    // For many properties, show a sample that increases with zoom
    return validListings.slice(0, totalToShow);
  }, [validListings, showCityMarkers, showLimitedProperties, zoomLevel]);

  const onLoad = useCallback(
    (map) => {
      if (!map) return;
      mapRef.current = map;
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom || 10);
      
      // Start zoomed out - don't auto-fit bounds, let user zoom in if needed
      // Only fit bounds if there's a single property
      if (validListings.length === 1) {
        const listing = validListings[0];
        const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
        const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setCenter({ lat, lng });
          map.setZoom(12);
        }
      } else if (mapCenter?.bounds && validListings.length > 1) {
        // For multiple properties, center the map but keep zoomed out
        map.setCenter(center);
        map.setZoom(8); // Set zoomed out view
        setZoomLevel(8);
      } else if (validListings.length > 0) {
        // Center on the calculated center but keep zoomed out
        map.setCenter(center);
        map.setZoom(8); // Set zoomed out view
        setZoomLevel(8);
      }
      
      map.addListener("zoom_changed", () => {
        const newZoom = map.getZoom();
        if (newZoom !== null && newZoom !== undefined) {
          setZoomLevel(newZoom);
        }
      });
      
      if (onBoundsChange) {
        const report = () => {
          const b = map.getBounds();
          if (!b) return;
          const ne = b.getNorthEast();
          const sw = b.getSouthWest();
          const pad = 0.15;
          const latSpan = ne.lat() - sw.lat();
          const lngSpan = ne.lng() - sw.lng();
          onBoundsChange({
            north: ne.lat() + latSpan * pad,
            south: sw.lat() - latSpan * pad,
            east: ne.lng() + lngSpan * pad,
            west: sw.lng() - lngSpan * pad,
          });
        };
        report();
        map.addListener("idle", report);
      }
    },
    [onBoundsChange, mapCenter, validListings.length]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Update map center when listings change (but keep zoomed out)
  useEffect(() => {
    if (mapRef.current && validListings.length > 0) {
      // Only update center, don't change zoom (keep zoomed out)
      if (validListings.length === 1) {
        const listing = validListings[0];
        const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
        const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
        if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(12);
        }
      } else {
        // For multiple properties, just center the map, keep zoomed out
        if (mapRef.current) {
          mapRef.current.setCenter(center);
          // Don't change zoom - keep it zoomed out (default zoom level)
        }
      }
    }
  }, [validListings, center]);

  if (!apiKey) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center" style={{ minHeight: '400px' }}>
        <p className="text-gray-700 font-medium text-lg mb-2">
          Google Map requires an API key.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Add <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code className="bg-gray-200 px-1 rounded">.env.local</code>
        </p>
      </div>
    );
  }

  // Check for errors first (including invalid API key)
  if (loadError) {
    const errorMessage = loadError?.message || "";
    const isInvalidKey = errorMessage.includes("InvalidKey") || errorMessage.includes("InvalidKeyMapError");
    const isRefererError = errorMessage.includes("RefererNotAllowedMapError") || errorMessage.includes("RefererNotAllowed");
    
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center" style={{ minHeight: '400px' }}>
        <p className="text-gray-700 font-medium text-lg mb-2">
          {isRefererError 
            ? "API Key Domain Restriction Error" 
            : isInvalidKey 
              ? "Invalid Google Maps API Key" 
              : "Failed to load Google Maps."}
        </p>
        {(isInvalidKey || isRefererError) && (
          <div className="text-sm text-gray-600 mt-2 space-y-2 max-w-md">
            {isRefererError ? (
              <>
                <p className="font-semibold">Your site URL is not authorized in Google Cloud Console.</p>
                <p className="text-xs text-gray-500 mt-2">
                  To fix this:
                  <br />1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console → APIs & Services → Credentials</a>
                  <br />2. Click on your API key
                  <br />3. Under "Application restrictions", add:
                  <br />   • <code className="bg-gray-200 px-1 rounded">http://localhost:3000/*</code>
                  <br />   • <code className="bg-gray-200 px-1 rounded">http://localhost:3001/*</code>
                  <br />   • Your production domain (e.g., <code className="bg-gray-200 px-1 rounded">https://yourdomain.com/*</code>)
                  <br />4. Click "Save" and wait 1-2 minutes
                  <br />5. Refresh this page
                </p>
              </>
            ) : (
              <>
                <p>The Google Maps API key is invalid or not properly configured.</p>
                <p className="text-xs text-gray-500">
                  Please verify:
                  <br />1. The API key is correct in <code className="bg-gray-200 px-1 rounded">.env.local</code>
                  <br />2. "Maps JavaScript API" is enabled in Google Cloud Console
                  <br />3. API key restrictions allow your domain (localhost for dev)
                  <br />4. Restart your dev server after updating .env.local
                </p>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!isLoaded) {
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
    <div className="h-full w-full relative" id="google-map-container" style={{ minHeight: '400px', height: '100%', width: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          zoomControlOptions: { position: 8 },
          scrollwheel: true, // Map zoom with scrollwheel is fine, but container won't scroll
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: { position: 7 },
          disableDefaultUI: false,
          gestureHandling: "cooperative",
          minZoom: 6,
          maxZoom: 20,
          // Smooth rendering
          draggable: true,
          clickableIcons: false,
          keyboardShortcuts: true,
          optimized: true,
          styles: [
            // Use Google Maps default colors - just ensure roads are visible
            // Minimal styling to keep natural Google Maps appearance
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "road",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "road.arterial",
              elementType: "geometry",
              stylers: [{ visibility: "on" }],
            },
            {
              featureType: "road.local",
              elementType: "geometry",
              stylers: [{ visibility: "on" }],
            },
            // Hide transit
            {
              featureType: "transit",
              elementType: "all",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "simplified" }],
            },
          ],
        }}
      >
        {showCityMarkers
          ? cityGroups.map((city) => (
              <Marker
                key={city.key}
                position={city.center}
                icon={{
                  url: createCityIconSVG(city.count),
                  scaledSize: { width: 32, height: 32 },
                  anchor: { x: 16, y: 16 },
                }}
                onClick={() => {
                  const isCurrentlySelected = selectedCityKey === city.key;
                  setSelectedCityKey(isCurrentlySelected ? null : city.key);
                  // Auto-zoom to city when clicked (if not already selected)
                  if (mapRef.current && !isCurrentlySelected) {
                    mapRef.current.setCenter(city.center);
                    mapRef.current.setZoom(ZOOM_PROPERTY_LEVEL);
                  }
                }}
              >
                {selectedCityKey === city.key && (
                  <InfoWindow 
                    position={city.center}
                    onCloseClick={() => setSelectedCityKey(null)}
                  >
                    <div className="p-3 min-w-[180px]">
                      <p className="font-bold text-[#091D35] text-base mb-1">{city.cityName}</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {city.count} propert{city.count === 1 ? "y" : "ies"} available
                      </p>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Click marker to zoom in and see all listings
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))
          : displayedListings.map((listing, index) => {
          const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
          const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
          if (isNaN(lat) || isNaN(lng)) return null;
          const id = listing.ListingId || listing.Id || index;
          const streetNum = getStreetNumber(listing);
          const price = listing.ListPrice
            ? `$${parseInt(listing.ListPrice).toLocaleString()}`
            : "Price on request";
          const address =
            listing.UnparsedAddress ||
            `${listing.StreetNumber || ""} ${listing.StreetName || ""}`.trim() ||
            `${listing.City || ""}, ${listing.Province || "NS"}`.trim();
          const beds = listing.BedroomsTotal || "N/A";
          const baths = listing.BathroomsTotalInteger || listing.BathroomsTotal || "N/A";
          const sqft =
            listing.BuildingAreaTotal || listing.LivingArea || listing.AboveGradeFinishedArea;
          const mls = listing.ListingId || listing.MlsNumber || listing.Id;
          // Get property image - try multiple sources
          const imageUrl =
            listing.Image ||
            listing.Media?.[0]?.MediaURL ||
            listing.Media?.[0]?.MediaURLThumb ||
            listing.Photos?.[0]?.Url ||
            listing.Photos?.[0]?.ThumbnailUrl ||
            listing.PhotoUrl ||
            listing.ThumbnailUrl ||
            "/images/placeholder.jpg";
          const citySlug = encodeURIComponent(
            (listing.City || "nova-scotia").toLowerCase().replace(/\s+/g, "-")
          );
          const detailUrl = `/buy/${citySlug}/${listing.ListingId || listing.Id}`;

          return (
            <Marker
              key={id}
              position={{ lat, lng }}
              icon={{
                url: DOT_ICON_SVG,
                scaledSize: { width: 14, height: 14 },
                anchor: { x: 7, y: 7 },
              }}
              onClick={() => {
                setSelectedId(selectedId === id ? null : id);
              }}
              cursor="pointer"
            >
              {selectedId === id && (
                <InfoWindow 
                  position={{ lat, lng }}
                  onCloseClick={() => setSelectedId(null)}
                  options={{
                    maxWidth: 320,
                    pixelOffset: new window.google.maps.Size(0, -10), // Small offset above the dot
                    disableAutoPan: true, // Don't auto pan - show at same position
                    enableEventPropagation: false,
                  }}
                >
                  <div style={{ width: '300px', maxWidth: '300px', overflow: 'hidden' }} className="p-0 bg-white shadow-xl border border-gray-200">
                    {/* Property Image - Smaller to fit without scroll */}
                    {imageUrl && imageUrl !== "/images/placeholder.jpg" ? (
                      <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#f3f4f6' }}>
                        <img
                          src={imageUrl}
                          alt={address || "Property"}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div style={{ display: 'none', width: '100%', height: '100%', background: 'linear-gradient(to bottom right, #e5e7eb, #d1d5db)', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0 }}>
                          <p style={{ color: '#6b7280', fontSize: '12px' }}>No Image</p>
                        </div>
                        <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: '#dc2626', color: 'white', fontSize: '10px', fontWeight: '600', padding: '3px 6px', borderRadius: '3px' }}>
                          For Sale
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '180px', background: 'linear-gradient(to bottom right, #e5e7eb, #d1d5db)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#6b7280', fontSize: '12px' }}>No Image Available</p>
                      </div>
                    )}
                    
                    {/* Property Details - Compact to fit without scroll */}
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#091D35', marginBottom: '6px', lineHeight: '1.2', marginTop: 0 }}>{price}</h3>
                      <p style={{ fontSize: '13px', color: '#374151', fontWeight: '600', marginBottom: '10px', lineHeight: '1.3' }}>{address}</p>
                      
                      {/* Property Features */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600' }}>{beds}</span>
                        <span>bed{beds !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span style={{ fontWeight: '600' }}>{baths}</span>
                        <span>bath{baths !== 1 ? "s" : ""}</span>
                        {sqft && (
                          <>
                            <span>·</span>
                            <span style={{ fontWeight: '600' }}>{Number(sqft).toLocaleString()}</span>
                            <span>sqft</span>
                          </>
                        )}
                      </div>
                      
                      {/* MLS Number */}
                      {mls && (
                        <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', marginTop: 0 }}>
                          <span style={{ fontWeight: '500' }}>MLS®:</span> {mls}
                        </p>
                      )}
                      
                      {/* View Details Button */}
                      <a
                        href={detailUrl}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#091D35',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: '600',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'background-color 0.2s',
                          marginTop: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#0a2540';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#091D35';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        View Full Details →
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}
      </GoogleMap>
    </div>
  );
}