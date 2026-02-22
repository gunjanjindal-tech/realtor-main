"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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

// City cluster icon - larger dot (for city markers)
const CITY_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#091d35" stroke="#ffffff" stroke-width="2"/></svg>'
  );

const defaultCenter = { lat: 44.6488, lng: -63.5752 };
const ZOOM_CITY_LEVEL = 11; // zoom < this: show only city markers
const ZOOM_PROPERTY_LEVEL = 14; // zoom >= this: show all individual properties
// zoom 11-13: show limited properties (sampling)

export default function PropertyListingsMapGoogle({ listings = [], mapCenter, onBoundsChange }) {
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
    libraries: ["places", "geometry"],
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
    if (validListings.length === 0) return 10;
    if (validListings.length === 1) return 19;
    return 10; // Start with city view (zoom < 11 shows cities only)
  }, [validListings.length]);
  
  // Progressive zoom levels:
  // - Zoom < 11: Only city markers (clean view)
  // - Zoom 11-13: Show limited properties (gradual reveal)
  // - Zoom >= 14: Show all individual properties
  const showCityMarkers = zoomLevel < ZOOM_CITY_LEVEL && validListings.length > 1;
  const showLimitedProperties = zoomLevel >= ZOOM_CITY_LEVEL && zoomLevel < ZOOM_PROPERTY_LEVEL;
  
  // For limited property view, show progressively more properties based on zoom
  const displayedListings = useMemo(() => {
    if (showCityMarkers) return [];
    if (!showLimitedProperties) return validListings;
    
    // Calculate how many properties to show based on zoom level
    // At zoom 11: show very few (1-2 per city)
    // At zoom 13: show more (5-10 per city)
    const zoomProgress = (zoomLevel - ZOOM_CITY_LEVEL) / (ZOOM_PROPERTY_LEVEL - ZOOM_CITY_LEVEL); // 0 to 1
    const maxPerCity = Math.max(1, Math.floor(2 + zoomProgress * 8)); // 2 to 10 per city
    
    const sampled = [];
    cityGroups.forEach((city) => {
      const sample = city.listings.slice(0, maxPerCity);
      sampled.push(...sample);
    });
    
    // Limit total to 300 for performance
    return sampled.slice(0, 300);
  }, [validListings, showCityMarkers, showLimitedProperties, cityGroups, zoomLevel]);

  const onLoad = useCallback(
    (map) => {
      if (!map) return;
      mapRef.current = map;
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom || 12);
      
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
    [onBoundsChange]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

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
    
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center" style={{ minHeight: '400px' }}>
        <p className="text-gray-700 font-medium text-lg mb-2">
          {isInvalidKey ? "Invalid Google Maps API Key" : "Failed to load Google Maps."}
        </p>
        {isInvalidKey && (
          <div className="text-sm text-gray-600 mt-2 space-y-2 max-w-md">
            <p>The Google Maps API key is invalid or not properly configured.</p>
            <p className="text-xs text-gray-500">
              Please verify:
              <br />1. The API key is correct in <code className="bg-gray-200 px-1 rounded">.env.local</code>
              <br />2. "Maps JavaScript API" is enabled in Google Cloud Console
              <br />3. API key restrictions allow your domain (localhost for dev)
              <br />4. Restart your dev server after updating .env.local
            </p>
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
    <div className="h-full w-full relative" id="google-map-container" style={{ minHeight: '400px', height: '100%' }}>
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[800] border border-gray-200 max-w-[280px]">
        <p className="text-xs text-gray-700 font-medium">
          {showCityMarkers
            ? `📍 City view (Zoom ${Math.round(zoomLevel)}): Click any city marker to zoom in`
            : showLimitedProperties
              ? `🏠 Showing sample properties (Zoom ${Math.round(zoomLevel)}): Zoom in more to see all ${validListings.length} properties`
              : onBoundsChange
                ? `🏠 All properties (Zoom ${Math.round(zoomLevel)}): Zoom out for city overview`
                : "Click markers for property details"}
        </p>
      </div>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          zoomControlOptions: { position: 8 },
          scrollwheel: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: { position: 7 },
          disableDefaultUI: false,
          gestureHandling: "cooperative",
          minZoom: 6,
          maxZoom: 20,
        }}
      >
        {showCityMarkers
          ? cityGroups.map((city) => (
              <Marker
                key={city.key}
                position={city.center}
                icon={{
                  url: CITY_ICON_SVG,
                  scaledSize: { width: 20, height: 20 },
                  anchor: { x: 10, y: 10 },
                }}
                label={{
                  text: `${city.count}`,
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
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
          const imageUrl =
            listing.Image ||
            listing.Media?.[0]?.MediaURL ||
            listing.Media?.[0]?.MediaURLThumb ||
            "/images/placeholder.jpg";
          const citySlug = encodeURIComponent(
            (listing.City || "nova-scotia").toLowerCase().replace(/\s+/g, "-")
          );
          const detailUrl = `/buy/${citySlug}/${listing.ListingId || listing.Id}`;

          // Format price for label (e.g., "2.2M", "550K", "12M")
          const formatPriceLabel = (priceStr) => {
            const num = parseInt(priceStr.replace(/[^0-9]/g, ""));
            if (isNaN(num)) return "";
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`.replace(".0M", "M");
            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
            return num.toString();
          };
          
          const priceLabel = listing.ListPrice ? formatPriceLabel(listing.ListPrice.toString()) : "";
          
          return (
            <Marker
              key={id}
              position={{ lat, lng }}
              icon={{
                url: DOT_ICON_SVG,
                scaledSize: { width: 14, height: 14 },
                anchor: { x: 7, y: 7 },
              }}
              label={
                priceLabel
                  ? {
                      text: priceLabel,
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: "700",
                    }
                  : undefined
              }
              onClick={() => {
                setSelectedId(selectedId === id ? null : id);
              }}
              cursor="pointer"
            >
              {selectedId === id && (
                <InfoWindow 
                  position={{ lat, lng }}
                  onCloseClick={() => setSelectedId(null)}
                >
                  <div className="p-0 max-w-[320px] overflow-hidden rounded-lg bg-white shadow-lg">
                    {imageUrl && (
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={address}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-[#091D35] text-lg mb-2">{price}</h3>
                      <p className="text-sm text-gray-700 font-medium mb-2">{address}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                        <span>{beds} bed</span>
                        <span>·</span>
                        <span>{baths} bath</span>
                        {sqft && (
                          <>
                            <span>·</span>
                            <span>{Number(sqft).toLocaleString()} sqft</span>
                          </>
                        )}
                      </div>
                      {mls && (
                        <p className="text-xs text-gray-400 mb-3">MLS®: {mls}</p>
                      )}
                      <Link
                        href={detailUrl}
                        className="inline-block w-full text-center px-4 py-2 bg-[#091D35] text-white text-sm font-semibold rounded-lg hover:bg-[#0a2540] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        View Full Details
                      </Link>
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
