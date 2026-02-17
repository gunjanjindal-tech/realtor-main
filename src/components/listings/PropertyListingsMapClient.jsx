"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import Link from "next/link";

// Format price for marker bubble: 800000 -> "800K", 1200000 -> "1.2M"
function formatPriceShort(listPrice) {
  if (listPrice == null || listPrice === "" || isNaN(Number(listPrice))) return "—";
  const n = parseInt(listPrice, 10);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

// Street/property number from address (e.g. "1040 Clay Avenue" -> "1040")
function getStreetNumber(listing) {
  const n = listing.StreetNumber || listing.StreetNumberNumeric;
  if (n != null && String(n).trim() !== "") return String(n).trim();
  const addr = listing.UnparsedAddress || listing.AddressLine1 || "";
  const first = addr.trim().split(/\s+/)[0];
  if (first != null && /^\d+[A-Za-z]?$/.test(first)) return first;
  return null;
}

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
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_DEBOUNCE_MS = 600;

// Fetch nearby address numbers from OpenStreetMap (agal bagal ke numbers)
async function fetchNearbyAddressNumbers(south, west, north, east) {
  const bbox = `${south},${west},${north},${east}`;
  const query = `[out:json][timeout:8];node["addr:housenumber"](${bbox});out body;`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.elements || []).map((el) => ({
    lat: el.lat,
    lng: el.lon,
    number: el.tags?.["addr:housenumber"] || "",
  })).filter((p) => p.number && p.lat != null && p.lng != null);
}

// Small grey label icon for nearby property numbers (not our listings)
function createNearbyNumberIcon(L, number) {
  if (!L?.divIcon) return null;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return L.divIcon({
    className: "nearby-number-marker",
    html: `<span style="display:inline-block;padding:2px 6px;background:rgba(80,80,80,0.88);color:#fff;font-size:10px;font-weight:600;border-radius:4px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.2);">${esc(number)}</span>`,
    iconSize: [28, 18],
    iconAnchor: [14, 9],
  });
}

// Renders nearby address numbers from OSM when zoomed in (must be inside MapContainer)
function NearbyAddressLayer({ Leaflet, listingPositions }) {
  const map = useMap();
  const [points, setPoints] = useState([]);
  const fetchRef = useRef(null);
  const skipSet = useMemo(() => {
    const set = new Set();
    (listingPositions || []).forEach(([lat, lng]) => set.add(`${lat.toFixed(5)}_${lng.toFixed(5)}`));
    return set;
  }, [listingPositions]);

  useEffect(() => {
    if (!map || !Leaflet) return;
    const update = () => {
      const zoom = map.getZoom();
      if (zoom < 16) {
        setPoints([]);
        return;
      }
      const b = map.getBounds();
      const south = b.getSouth();
      const west = b.getWest();
      const north = b.getNorth();
      const east = b.getEast();
      if (fetchRef.current) clearTimeout(fetchRef.current);
      fetchRef.current = setTimeout(async () => {
        try {
          const list = await fetchNearbyAddressNumbers(south, west, north, east);
          const filtered = list.filter((p) => !skipSet.has(`${Number(p.lat).toFixed(5)}_${Number(p.lng).toFixed(5)}`));
          setPoints(filtered.slice(0, 120));
        } catch {
          setPoints([]);
        }
        fetchRef.current = null;
      }, OVERPASS_DEBOUNCE_MS);
    };
    update();
    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
      if (fetchRef.current) clearTimeout(fetchRef.current);
    };
  }, [map, Leaflet, skipSet]);

  if (!Leaflet || points.length === 0) return null;
  const validPoints = points.filter((p) => {
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });
  if (validPoints.length === 0) return null;
  return (
    <>
      {validPoints.map((p, i) => (
        <Marker
          key={`nearby-${p.lat}-${p.lng}-${i}`}
          position={[Number(p.lat), Number(p.lng)]}
          icon={createNearbyNumberIcon(Leaflet, p.number)}
          interactive={false}
          zIndexOffset={0}
        />
      ))}
    </>
  );
}

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
      const pad = 0.15; // expand by 15% so nearby (bagal) properties stay in list when zoomed in
      const latSpan = b.getNorth() - b.getSouth();
      const lngSpan = b.getEast() - b.getWest();
      onBoundsChangeRef.current?.({
        north: b.getNorth() + latSpan * pad,
        south: b.getSouth() - latSpan * pad,
        east: b.getEast() + lngSpan * pad,
        west: b.getWest() - lngSpan * pad,
      });
    };
    sendBounds();
    map.on("moveend", sendBounds);
    return () => map.off("moveend", sendBounds);
  }, [map, onBoundsChange]);

  return null;
}

// Escape for HTML
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Home icon + property number – white card with border so it clearly differentiates on map
const HOME_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="26" viewBox="0 0 24 28" fill="none" stroke="#091d35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>`;

function createHomeIconWithNumber(L, numberText) {
  if (!L?.divIcon) return null;
  const hasNumber = numberText != null && String(numberText).trim() !== "";
  const numEsc = esc(numberText || "");
  const html = hasNumber
    ? `<span class="property-home-marker-wrap"><span class="property-home-marker-inner">${HOME_ICON_SVG}</span><span class="property-home-marker-num">${numEsc}</span></span>`
    : `<span class="property-home-marker-wrap property-home-marker-icon-only"><span class="property-home-marker-inner">${HOME_ICON_SVG}</span></span>`;
  return L.divIcon({
    className: "property-home-marker",
    html,
    iconSize: hasNumber ? [52, 58] : [40, 44],
    iconAnchor: hasNumber ? [26, 58] : [20, 44],
  });
}

export default function PropertyListingsMapClient({ listings = [], mapCenter, onBoundsChange }) {
  const [Leaflet, setLeaflet] = useState(null);

  useEffect(() => {
    // Import Leaflet CSS and fix icon paths (only on client)
    if (typeof window !== "undefined") {
      import("leaflet/dist/leaflet.css");
      import("leaflet").then((L) => {
        const lib = L.default || L;
        const IconDefault = lib.Icon?.Default;
        if (IconDefault?.prototype?._getIconUrl) {
          delete IconDefault.prototype._getIconUrl;
        }
        if (IconDefault?.mergeOptions) {
          IconDefault.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          });
        }
        setLeaflet(lib);
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

  const listingPositions = useMemo(
    () =>
      validListings
        .map((l) => {
          const lat = parseFloat(l.Latitude || l.LatitudeDecimal);
          const lng = parseFloat(l.Longitude || l.LongitudeDecimal);
          return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
        })
        .filter(Boolean),
    [validListings]
  );

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
        zoom={validListings.length === 1 ? 19 : 12}
        minZoom={5}
        maxZoom={20}
        style={{ height: "100%", width: "100%", minHeight: 300 }}
        scrollWheelZoom={true}
        zoomControl={false}
        wheelPxPerZoomLevel={32}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
          maxNativeZoom={19}
        />
        {onBoundsChange && <MapBoundsReporter onBoundsChange={onBoundsChange} />}
        {/* Agal bagal: nearby address numbers from OSM when zoomed in (zoom >= 16) */}
        {Leaflet && <NearbyAddressLayer Leaflet={Leaflet} listingPositions={listingPositions} />}
        {/* Render markers only after Leaflet is loaded so price bubbles show (no default blue pin) */}
        {Leaflet && validListings.map((listing, index) => {
          const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
          const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
          if (isNaN(lat) || isNaN(lng)) return null;

          const streetNum = getStreetNumber(listing);
          const priceShort = formatPriceShort(listing.ListPrice);
          const price = listing.ListPrice
            ? `$${parseInt(listing.ListPrice).toLocaleString()}`
            : "Price on request";
          const address = listing.UnparsedAddress ||
            `${listing.StreetNumber || ""} ${listing.StreetName || ""}`.trim() ||
            `${listing.City || ""}, ${listing.Province || "NS"}`.trim();
          const beds = listing.BedroomsTotal || "N/A";
          const baths = listing.BathroomsTotalInteger || listing.BathroomsTotal || "N/A";
          const sqft = listing.BuildingAreaTotal || listing.LivingArea || listing.AboveGradeFinishedArea;
          const mls = listing.ListingId || listing.MlsNumber || listing.Id;
          const imageUrl = listing.Image || listing.Media?.[0]?.MediaURL || listing.Media?.[0]?.MediaURLThumb || "/images/placeholder.jpg";
          const citySlug = encodeURIComponent((listing.City || "nova-scotia").toLowerCase().replace(/\s+/g, "-"));
          const detailUrl = `/buy/${citySlug}/${listing.ListingId || listing.Id}`;

          const icon = createHomeIconWithNumber(Leaflet, streetNum);

          return (
            <Marker
              key={listing.ListingId || listing.Id || index}
              position={[lat, lng]}
              icon={icon}
              zIndexOffset={500}
            >
              <Popup>
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
                      <p className="text-xs text-gray-600 mb-0.5">{Number(sqft).toLocaleString()} sqft</p>
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
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Hint – zoom + for street detail; zoom control bottom-right */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[800]">
        <p className="text-xs text-gray-600">
          {onBoundsChange ? "Zoom in (+) for street & building detail · Pan to filter list" : "Click markers for details"}
        </p>
      </div>
    </>
  );
}

