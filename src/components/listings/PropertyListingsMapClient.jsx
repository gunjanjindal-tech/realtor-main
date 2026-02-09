"use client";

import { useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";

// Dynamically import Leaflet components (client-side only, no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Reports map bounds to parent when user zooms/pans (so list filters by visible area)
function MapBoundsReporter({ onBoundsChange }) {
  const map = useMap();
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    if (!map || !onBoundsChange) return;
    const sendBounds = () => {
      const b = map.getBounds();
      onBoundsChangeRef.current?.({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };
    sendBounds();
    map.on("moveend", sendBounds);
    return () => map.off("moveend", sendBounds);
  }, [map, onBoundsChange]);

  return null;
}

export default function PropertyListingsMapClient({ listings = [], mapCenter, onBoundsChange }) {
  useEffect(() => {
    // Import Leaflet CSS and fix icon paths (only on client)
    if (typeof window !== "undefined") {
      import("leaflet/dist/leaflet.css");
      
      import("leaflet").then((L) => {
        // Fix Leaflet icon paths for Next.js
        const IconDefault = L.default.Icon.Default;
        if (IconDefault.prototype._getIconUrl) {
          delete IconDefault.prototype._getIconUrl;
        }
        IconDefault.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      });
    }
  }, []);

  // Filter listings with valid coordinates
  const validListings = useMemo(() => {
    return listings.filter(
      (listing) => {
        const lat = listing.Latitude || listing.LatitudeDecimal;
        const lng = listing.Longitude || listing.LongitudeDecimal;
        return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
      }
    );
  }, [listings]);

  if (validListings.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-medium">No property locations available</p>
        <p className="text-sm mt-2">Bridge API coordinates not found</p>
      </div>
    );
  }

  return (
    <>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={validListings.length === 1 ? 15 : 10}
        minZoom={8}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onBoundsChange && <MapBoundsReporter onBoundsChange={onBoundsChange} />}
        {validListings.map((listing, index) => {
          const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
          const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
          
          if (isNaN(lat) || isNaN(lng)) return null;

          const price = listing.ListPrice 
            ? `$${parseInt(listing.ListPrice).toLocaleString()}` 
            : "Price on request";
          const address = listing.UnparsedAddress || 
                        `${listing.StreetNumber || ""} ${listing.StreetName || ""}`.trim() ||
                        `${listing.City || ""}, ${listing.Province || "NS"}`.trim();
          const beds = listing.BedroomsTotal || "N/A";
          const baths = listing.BathroomsTotalInteger || listing.BathroomsTotal || "N/A";

          return (
            <Marker
              key={listing.ListingId || listing.Id || index}
              position={[lat, lng]}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold text-[#091D35] text-sm mb-1">
                    {price}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {address}
                  </p>
                  <p className="text-xs text-gray-500">
                    {beds} bed, {baths} bath
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Show count + hint when list filters by map */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[1000]">
        <p className="text-sm font-semibold text-[#091D35]">
          {validListings.length} {validListings.length === 1 ? "Property" : "Properties"}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {onBoundsChange ? "Zoom or pan to filter list on the left" : "Click markers for details"}
        </p>
      </div>
    </>
  );
}

