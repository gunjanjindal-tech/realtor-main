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
        <p className="text-lg font-medium">Loading Property Locations ...</p>
        <p className="text-sm mt-2">Loading Bridge API Coordinates</p>
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
          const imageUrl = listing.Image || listing.Media?.[0]?.MediaURL || listing.Media?.[0]?.MediaURLThumb || "/images/placeholder.jpg";

          return (
            <Marker
              key={listing.ListingId || listing.Id || index}
              position={[lat, lng]}
            >
              <Popup>
                <div className="p-0 max-w-[280px] overflow-hidden rounded-lg">
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
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Hint only – count hidden per request */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[1000]">
        <p className="text-xs text-gray-600">
          {onBoundsChange ? "Zoom or pan to filter list on the left" : "Click markers for details"}
        </p>
      </div>
    </>
  );
}

