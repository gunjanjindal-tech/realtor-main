"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", minHeight: 300 };

function getStreetNumber(listing) {
  const n = listing.StreetNumber || listing.StreetNumberNumeric;
  if (n != null && String(n).trim() !== "") return String(n).trim();
  const addr = listing.UnparsedAddress || listing.AddressLine1 || "";
  const first = addr.trim().split(/\s+/)[0];
  if (first != null && /^\d+[A-Za-z]?$/.test(first)) return first;
  return null;
}

// Home icon as data URL for Google Marker
const HOME_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="36" viewBox="0 0 24 28" fill="none" stroke="#091d35" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>'
  );

const defaultCenter = { lat: 44.6488, lng: -63.5752 };
const ZOOM_PROPERTY_LEVEL = 13; // zoom >= this: show individual properties; below: show city markers

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
    if (validListings.length === 0) return 12;
    if (validListings.length === 1) return 19;
    return 12;
  }, [validListings.length]);
  
  const showCityMarkers = zoomLevel < ZOOM_PROPERTY_LEVEL && validListings.length > 1;

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
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
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
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
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
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" id="google-map-container">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[800]">
        <p className="text-xs text-gray-600">
          {showCityMarkers
            ? "Zoom in to see properties in each city"
            : onBoundsChange
              ? "Zoom out for city view · Pan to filter list"
              : "Click markers for details"}
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
          fullscreenControl: false,
          disableDefaultUI: false,
          gestureHandling: "cooperative",
        }}
      >
        {showCityMarkers
          ? cityGroups.map((city) => (
              <Marker
                key={city.key}
                position={city.center}
                icon={{
                  url: HOME_ICON_SVG,
                  scaledSize: { width: 36, height: 40 },
                  anchor: { x: 18, y: 40 },
                }}
                label={{
                  text: `${city.count}`,
                  color: "#091d35",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
                onClick={() => setSelectedCityKey(selectedCityKey === city.key ? null : city.key)}
              >
                {selectedCityKey === city.key && (
                  <InfoWindow onCloseClick={() => setSelectedCityKey(null)}>
                    <div className="p-2 min-w-[140px]">
                      <p className="font-semibold text-[#091D35]">{city.cityName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {city.count} propert{city.count === 1 ? "y" : "ies"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Zoom in to see all listings</p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))
          : validListings.map((listing, index) => {
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

          return (
            <Marker
              key={id}
              position={{ lat, lng }}
              icon={{
                url: HOME_ICON_SVG,
                scaledSize: { width: 32, height: 36 },
                anchor: { x: 16, y: 36 },
              }}
              label={
                streetNum
                  ? {
                      text: streetNum,
                      color: "#091d35",
                      fontSize: "12px",
                      fontWeight: "700",
                    }
                  : undefined
              }
              onClick={() => setSelectedId(selectedId === id ? null : id)}
            >
              {selectedId === id && (
                <InfoWindow onCloseClick={() => setSelectedId(null)}>
                  <div className="p-0 max-w-[280px] overflow-hidden rounded-lg bg-white">
                    {imageUrl && (
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={address}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-[#091D35] text-sm mb-1">{price}</h3>
                      {sqft && (
                        <p className="text-xs text-gray-600 mb-0.5">
                          {Number(sqft).toLocaleString()} sqft
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mb-2">{address}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {beds} bed, {baths} bath
                      </p>
                      {mls && (
                        <p className="text-xs text-gray-400 mb-2">MLS®: {mls}</p>
                      )}
                      <Link
                        href={detailUrl}
                        className="inline-block text-xs font-medium text-[#091D35] underline hover:no-underline"
                      >
                        View details →
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
