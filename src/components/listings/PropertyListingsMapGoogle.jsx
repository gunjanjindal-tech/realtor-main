"use client";

import { useCallback, useMemo, useRef, useState, useEffect, memo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer } from "@react-google-maps/api";
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

// Helper to format price for pins
function formatPriceLabel(price) {
  if (!price) return "";
  const num = Number(price);
  if (isNaN(num)) return price;
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `$${Math.round(num / 1000)}K`;
  }
  return `$${num}`;
}

// Generate an SVG data URI for a Zillow-style price pin
function createPricePinSVG(priceText, isSold, isHovered = false) {
  // Colors based on state
  const bg = isSold ? "#dc2626" : (isHovered ? "#ffffff" : "#091d35");
  const text = isHovered ? "#091d35" : "#ffffff";
  const border = isHovered ? "#091d35" : "none";
  
  // Dynamic width based on text length (approximate)
  const charWidth = 7;
  const padding = 16;
  const width = Math.max(50, priceText.length * charWidth + padding);
  const height = 28;
  const arrowHeight = 6;
  const arrowWidth = 10;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + arrowHeight}" viewBox="0 0 ${width} ${height + arrowHeight}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="6" fill="${bg}" ${border !== 'none' ? `stroke="${border}" stroke-width="1.5"` : ''}/>
      <polygon points="${width/2 - arrowWidth/2},${height} ${width/2 + arrowWidth/2},${height} ${width/2},${height + arrowHeight}" fill="${bg}"/>
      <text x="${width/2}" y="${height/2 + 4}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${text}" text-anchor="middle">${priceText}</text>
    </svg>
  `;
  
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg.trim());
}

// Global icon cache to avoid SVG regeneration in the render loop
const iconCache = new Map();

function getIconUrl(priceText, isSold, isHovered = false) {
  const cacheKey = `${priceText}-${isSold}-${isHovered}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);
  
  const url = createPricePinSVG(priceText, isSold, isHovered);
  iconCache.set(cacheKey, url);
  return url;
}

// Memoized Marker Component for high-performance rendering of 1000+ pins
const PriceMarker = memo(({ listing, clusterer, isSelected, onClick }) => {
  const id = listing.ListingId || listing.Id;
  const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
  const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) return null;

  const isFromSellAPI = listing.MlsStatus === "Sold" || listing.source === 'sell' || listing.ListingId?.startsWith('SELL-');
  const isSold = isFromSellAPI || listing.StandardStatus === 'Closed' || listing.MlsStatus === 'Closed';
  const priceValue = listing.ListPrice || listing.ClosePrice || listing.Price;
  const priceLabel = formatPriceLabel(priceValue) || "N/A";
  
  // Use cached icon
  const iconUrl = getIconUrl(priceLabel, isSold, isSelected);
  const width = Math.max(50, priceLabel.length * 7 + 16);

  // Stable icon object for Google Maps
  const icon = useMemo(() => ({
    url: iconUrl,
    scaledSize: new window.google.maps.Size(width, 34),
    anchor: new window.google.maps.Point(width / 2, 34),
  }), [iconUrl, width]);

  return (
    <Marker
      position={{ lat: latNum, lng: lngNum }}
      clusterer={clusterer}
      icon={icon}
      onClick={() => onClick(id)}
      zIndex={isSelected ? 1000 : 1}
    />
  );
});

const defaultCenter = { lat: 44.6488, lng: -63.5752 };
const ZOOM_CITY_LEVEL = 13; // zoom < this: show only city markers (very zoomed out)
const ZOOM_PROPERTY_LEVEL = 20; // zoom >= this: show all individual properties (hide city markers)

// Static libraries array to prevent LoadScript reload warning
// Geocoding is included since it's enabled on the API key
const GOOGLE_MAPS_LIBRARIES = ["places", "geometry", "geocoding"];

export default memo(function PropertyListingsMapGoogle({ listings = [], mapCenter = {}, bounds, onBoundsChange, searchQuery, hasSearchResults = false, onMapClick, onZoomChange, listingType = "sale" }) {
  const [selectedId, setSelectedId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedCityKey, setSelectedCityKey] = useState(null);
  const [mapTypeId, setMapTypeId] = useState("roadmap"); // Default to roadmap view
  const [searchLocation, setSearchLocation] = useState(null); // Geocoded point for roads/areas
  const mapRef = useRef(null);
  const zoomSetRef = useRef(false); // Track if zoom has been set for current search
  const ignoreNextBoundsUpdateRef = useRef(false); // Avoid loops when we programmatically fitBounds

  const apiKey = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "")
    : "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: "weekly",
    preventGoogleFontsLoading: true,
    // Performance optimizations
    loadingElement: null, // No loading element - faster render
  });

  const validListings = useMemo(
    () => {
      const filtered = listings.filter((l) => {
        // Check multiple possible coordinate field names
        const lat = l.Latitude || l.LatitudeDecimal || l.latitude || l.lat;
        const lng = l.Longitude || l.LongitudeDecimal || l.longitude || l.lng || l.lon;

        // Convert to number and validate
        const latNum = lat != null ? parseFloat(lat) : NaN;
        const lngNum = lng != null ? parseFloat(lng) : NaN;

        // Check if valid numbers and within valid ranges
        const isValid = !isNaN(latNum) && !isNaN(lngNum) &&
          latNum >= -90 && latNum <= 90 &&
          lngNum >= -180 && lngNum <= 180;

        return isValid;
      });

      // Show ALL properties in validListings - no more slice limit
      // Debug logging for search (only in development, and only once per search)
      if (process.env.NODE_ENV === "development" && searchQuery && searchQuery.trim().length > 0) {
        // Only log if this is a new search (not on every render)
        const searchKey = `${searchQuery}-${filtered.length}`;
        if (!window._lastSearchLog || window._lastSearchLog !== searchKey) {
          window._lastSearchLog = searchKey;
          console.log("🗺️ Map Component - Valid Listings (Unrestricted):", {
            searchQuery,
            totalListings: listings.length,
            validListings: filtered.length
          });
        }
      }

      return filtered;
    },
    [listings, searchQuery]
  );



  const onLoad = useCallback(
    (map) => {
      if (!map) return;
      mapRef.current = map;
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom || 10);

      // Set default map type to roadmap (not satellite)
      map.setMapTypeId("roadmap");
      setMapTypeId("roadmap");

      // Fast initialization - fit bounds to show all properties
      // BUT: Don't set zoom if we're searching - let the search effect handle it
      if (searchQuery && searchQuery.trim().length > 0) {
        // When searching, don't set zoom here - let the search geocoding effect handle it
        // This prevents zoom conflicts and fluctuation
        return;
      }

      if (validListings.length === 1) {
        const listing = validListings[0];
        // Check multiple possible coordinate field names
        const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
        const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
        const latNum = lat != null ? parseFloat(lat) : NaN;
        const lngNum = lng != null ? parseFloat(lng) : NaN;
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          map.setCenter({ lat: latNum, lng: lngNum });
          map.setZoom(14);
        }
      } else if (validListings.length > 1) {
        // Fit bounds to show all properties - zoom out to show everything
        // Use setTimeout to ensure map is fully initialized
        setTimeout(() => {
          const bounds = new window.google.maps.LatLngBounds();
          let hasValidCoords = false;

          validListings.forEach((listing) => {
            // Check multiple possible coordinate field names
            const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
            const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
            const latNum = lat != null ? parseFloat(lat) : NaN;
            const lngNum = lng != null ? parseFloat(lng) : NaN;
            if (!isNaN(latNum) && !isNaN(lngNum)) {
              bounds.extend({ lat: latNum, lng: lngNum });
              hasValidCoords = true;
            }
          });

          if (hasValidCoords) {
            // Increased padding to 80px for better visibility of all properties
            map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
            // When not searching, keep zoom below 12 to show city clusters
            setTimeout(() => {
              const zoom = map.getZoom();
              if (zoom && zoom >= 12) {
                map.setZoom(11);
                setZoomLevel(11);
              } else {
                setZoomLevel(zoom || 8);
              }
            }, 50);
          } else {
            // Fallback to center if no valid coords
            map.setCenter(defaultCenter);
            map.setZoom(8);
            setZoomLevel(8);
          }
        }, 100);
      }

      /*
      map.addListener("zoom_changed", () => {
        // Redundant with idle listener
      });
      */

      // Listen for map type changes to track user selection
      map.addListener("maptypeid_changed", () => {
        const currentMapType = map.getMapTypeId();
        if (currentMapType) {
          setMapTypeId(currentMapType);
        }
      });

      if (onBoundsChange) {
        const report = () => {
          const b = map.getBounds();
          if (!b) return;
          const ne = b.getNorthEast();
          const sw = b.getSouthWest();
          const pad = 0.02;
          const latSpan = ne.lat() - sw.lat();
          const lngSpan = ne.lng() - sw.lng();
          onBoundsChange({
            north: ne.lat() + latSpan * pad,
            south: sw.lat() - latSpan * pad,
            east: ne.lng() + lngSpan * pad,
            west: sw.lng() - lngSpan * pad,
          });
        };
          // report(); // Duplicate of idle call
        map.addListener("idle", report);
      }

      // Handle map clicks - reverse geocode to get location name and update search
      // Only if Geocoding API is available (optional feature)
      if (onMapClick && window.google?.maps?.Geocoder) {
        const clickListener = map.addListener("click", (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          // Suppress geocoding errors completely
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalLog = console.log;

          const suppressGeocodingErrors = () => {
            console.error = (...args) => {
              const message = String(args.join(' ')).toLowerCase();
              if (message.includes('geocoding') ||
                message.includes('api key is not authorized') ||
                message.includes('this api key is not authorized') ||
                message.includes('geocoding service')) {
                return; // Suppress geocoding errors
              }
              originalError.apply(console, args);
            };
            console.warn = (...args) => {
              const message = String(args.join(' ')).toLowerCase();
              if (message.includes('geocoding') ||
                message.includes('api key') ||
                message.includes('geocoding service')) {
                return; // Suppress geocoding warnings
              }
              originalWarn.apply(console, args);
            };
          };

          suppressGeocodingErrors();

          try {
            // Reverse geocode to get location name (optional - fails silently if API not enabled)
            const geocoder = new window.google.maps.Geocoder();

            // Add error handler to catch API errors
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              // Restore console immediately
              console.error = originalError;
              console.warn = originalWarn;
              console.log = originalLog;

              // Silently handle all errors - don't show to user
              if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
                const result = results[0];
                // Get the most relevant location name (street, city, or formatted address)
                const route = result.address_components.find(c => c.types.includes("route"))?.long_name;
                const locality = result.address_components.find(c => c.types.includes("locality"))?.long_name;
                const locationName = route || locality || result.formatted_address?.split(",")[0] || "";

                if (locationName && onMapClick) {
                  onMapClick(locationName.trim());
                }
              }
              // If status is not OK, silently fail - geocoding is optional
            });
          } catch (error) {
            // Silently ignore all geocoding errors
            console.error = originalError;
            console.warn = originalWarn;
            console.log = originalLog;
          }
        });

        // Store listener for cleanup if needed
        return () => {
          if (clickListener) {
            window.google.maps.event.removeListener(clickListener);
          }
        };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onBoundsChange, validListings.length, onMapClick, searchQuery]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Fit bounds when bounds prop changes (e.g., after search)
  useEffect(() => {
    if (bounds && mapRef.current) {
      ignoreNextBoundsUpdateRef.current = true;
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      // Ensure we do not keep zooming beyond max
      setTimeout(() => {
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom();
          if (currentZoom && currentZoom > 15) {
            mapRef.current.setZoom(15);
          }
        }
      }, 100);
    }
  }, [bounds]);

  // ALWAYS geocode search query first to show exact searched location
  // Priority: Show exact searched location, then show properties if they exist
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !searchQuery) {
      // Reset zoom flag when search query is cleared
      if (!searchQuery) {
        zoomSetRef.current = false;
      }
      return;
    }

    // Reset zoom flag when new search starts
    zoomSetRef.current = false;

    const searchAddress = searchQuery.trim();
    if (!searchAddress) {
      return;
    }

    if (!window.google?.maps?.Geocoder) {
      console.warn("Geocoder not available");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();

    // Enhance search address to prioritize Nova Scotia, Canada
    // Add "Nova Scotia" or "NS, Canada" if not already present to avoid finding locations in other countries
    let enhancedAddress = searchAddress;
    const addressLower = searchAddress.toLowerCase().trim();

    // List of common streets/roads in Halifax/Dartmouth area
    const halifaxStreets = [
      'barrington street', 'spring garden road', 'quinpool road', 'robie street', 'gottingen street',
      'agricola street', 'hollis street', 'young street', 'oxford street', 'chebucto road',
      'almon street', 'connaught avenue', 'windsor street', 'jubilee road', 'coburg road',
      'tower road', 'inglis street', 'morris street', 'sackville street', 'brunswick street',
      'prince street', 'duke street', 'bedford highway', 'larry uteck boulevard', 'hammonds plains road',
      'main street', 'pleasant street', 'portland street', 'woodland avenue', 'kings road',
      'victoria road', 'alderney drive', 'wyse road', 'windmill road', 'baker drive',
      'ochterloney street', 'portland hills drive', 'caldwell road', 'cole harbour road',
      'bissett road', 'forest hills parkway', 'cumberland drive', 'braemar drive', 'micmac boulevard',
      'tacoma drive', 'lakefront road', 'maple street', 'pine street', 'birch street',
      'cedar street', 'elm street', 'willow street', 'park street', 'hillcrest avenue',
      'riverside drive', 'harbour drive', 'seaview drive', 'oceanview drive', 'sunset drive',
      'meadow lane', 'albaster bay', 'albaster way', 'halifax'
    ];

    // Special handling for common city names to ensure we get Nova Scotia location
    const commonCities = ['halifax', 'dartmouth', 'sydney', 'truro', 'new glasgow', 'glace bay', 'kentville', 'amherst'];
    const isCommonCity = commonCities.some(city => addressLower === city || addressLower.startsWith(city + ' '));

    // Check if it's a street name (contains common street keywords or matches known streets)
    const isStreetName = halifaxStreets.some(street =>
      addressLower.includes(street) ||
      addressLower === street ||
      addressLower.includes('street') ||
      addressLower.includes('road') ||
      addressLower.includes('drive') ||
      addressLower.includes('avenue') ||
      addressLower.includes('boulevard') ||
      addressLower.includes('highway') ||
      addressLower.includes('lane') ||
      addressLower.includes('way')
    );

    // For specific city names, use exact city name
    if (addressLower === 'halifax' || addressLower.startsWith('halifax ')) {
      enhancedAddress = "Halifax, Nova Scotia, Canada";
    } else if (addressLower === 'dartmouth' || addressLower.startsWith('dartmouth ')) {
      enhancedAddress = "Dartmouth, Nova Scotia, Canada";
    } else if (isStreetName && !addressLower.includes("halifax") && !addressLower.includes("dartmouth") && !addressLower.includes("nova scotia") && !addressLower.includes("ns") && !addressLower.includes("canada")) {
      // Most streets are in Halifax, but some are in Dartmouth
      const dartmouthStreets = ['alderney drive', 'wyse road', 'windmill road', 'baker drive', 'ochterloney street',
        'portland hills drive', 'caldwell road', 'cole harbour road', 'bissett road', 'forest hills parkway',
        'cumberland drive', 'braemar drive', 'micmac boulevard', 'tacoma drive', 'lakefront road'];
      const isDartmouthStreet = dartmouthStreets.some(street => addressLower.includes(street));

      if (isDartmouthStreet) {
        enhancedAddress = `${searchAddress}, Dartmouth, Nova Scotia, Canada`;
      } else {
        enhancedAddress = `${searchAddress}, Halifax, Nova Scotia, Canada`;
      }
    } else if (isCommonCity || (!addressLower.includes("nova scotia") && !addressLower.includes("ns") && !addressLower.includes("canada"))) {
      // For other cities, use the city name with Nova Scotia
      if (addressLower === 'sydney' || addressLower.startsWith('sydney ')) {
        enhancedAddress = "Sydney, Nova Scotia, Canada";
      } else if (addressLower === 'truro' || addressLower.startsWith('truro ')) {
        enhancedAddress = "Truro, Nova Scotia, Canada";
      } else if (addressLower === 'new glasgow' || addressLower.startsWith('new glasgow ')) {
        enhancedAddress = "New Glasgow, Nova Scotia, Canada";
      } else if (addressLower === 'glace bay' || addressLower.startsWith('glace bay ')) {
        enhancedAddress = "Glace Bay, Nova Scotia, Canada";
      } else if (addressLower === 'kentville' || addressLower.startsWith('kentville ')) {
        enhancedAddress = "Kentville, Nova Scotia, Canada";
      } else if (addressLower === 'amherst' || addressLower.startsWith('amherst ')) {
        enhancedAddress = "Amherst, Nova Scotia, Canada";
      } else {
        enhancedAddress = `${searchAddress}, Nova Scotia, Canada`;
      }
    }

    // Suppress geocoding errors in console (API key issues, etc.)
    const originalError = console.error;
    const originalWarn = console.warn;

    const suppressGeocodingErrors = () => {
      console.error = (...args) => {
        const message = String(args.join(' ')).toLowerCase();
        if (message.includes('geocoding') ||
          message.includes('api key is not authorized') ||
          message.includes('this api key is not authorized') ||
          message.includes('geocoding service')) {
          return; // Suppress geocoding errors
        }
        originalError.apply(console, args);
      };
      console.warn = (...args) => {
        const message = String(args.join(' ')).toLowerCase();
        if (message.includes('geocoding') ||
          message.includes('api key') ||
          message.includes('geocoding service')) {
          return; // Suppress geocoding warnings
        }
        originalWarn.apply(console, args);
      };
    };

    suppressGeocodingErrors();

    // Use bounds bias to prioritize Nova Scotia region (approximate bounds for NS)
    const novaScotiaBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(43.0, -66.5), // Southwest corner
      new window.google.maps.LatLng(47.0, -59.0)  // Northeast corner
    );

    geocoder.geocode(
      {
        address: enhancedAddress,
        region: "CA", // Canada
        bounds: novaScotiaBounds, // Bias towards Nova Scotia region
        componentRestrictions: {
          country: "CA" // Restrict to Canada only
        }
      },
      (results, status) => {
        // Restore console immediately
        console.error = originalError;
        console.warn = originalWarn;
        if (status === "OK" && results && results.length > 0) {
          // Filter results to only use Canada locations (prefer Nova Scotia)
          let bestResult = results[0];
          for (const result of results) {
            const addressComponents = result.address_components || [];
            const country = addressComponents.find(comp => comp.types.includes("country"));
            const province = addressComponents.find(comp => comp.types.includes("administrative_area_level_1"));

            // Prefer results in Canada
            if (country && country.short_name === "CA") {
              // If it's Nova Scotia, use it immediately
              if (province && (province.short_name === "NS" || province.long_name === "Nova Scotia")) {
                // For Halifax specifically, STRICTLY prefer "locality" type (city center of Halifax)
                if (addressLower === 'halifax' || addressLower.startsWith('halifax ')) {
                  const locality = result.address_components.find(c => c.types.includes("locality"));
                  const postalTown = result.address_components.find(c => c.types.includes("postal_town"));
                  // Must be Halifax locality or postal town
                  if (locality && locality.long_name.toLowerCase() === 'halifax') {
                    bestResult = result;
                    break; // Found exact Halifax city center
                  } else if (postalTown && postalTown.long_name.toLowerCase() === 'halifax') {
                    bestResult = result;
                    break; // Found Halifax postal town
                  }
                } else {
                  // For other cities, use first NS result
                  bestResult = result;
                  break;
                }
              }
              // Otherwise, use first Canada result
              if (bestResult === results[0] || !bestResult.address_components?.find(c => c.types.includes("country") && c.short_name === "CA")) {
                bestResult = result;
              }
            }
          }

          const location = bestResult.geometry.location;
          let lat = location.lat();
          let lng = location.lng();
          const formattedAddress = bestResult.formatted_address || searchAddress;

          // For Halifax specifically, verify coordinates are in Halifax area
          // Halifax city center is approximately: 44.6488, -63.5752
          if (addressLower === 'halifax' || addressLower.startsWith('halifax ')) {
            const halifaxCenterLat = 44.6488;
            const halifaxCenterLng = -63.5752;
            const halifaxLatRange = 0.15; // ~15km radius
            const halifaxLngRange = 0.15;

            // Check if geocoded location is within Halifax area
            const isInHalifaxArea =
              lat >= (halifaxCenterLat - halifaxLatRange) &&
              lat <= (halifaxCenterLat + halifaxLatRange) &&
              lng >= (halifaxCenterLng - halifaxLngRange) &&
              lng <= (halifaxCenterLng + halifaxLngRange);

            // If geocoded location is NOT in Halifax area, use known Halifax center coordinates
            if (!isInHalifaxArea) {
              if (process.env.NODE_ENV === "development") {
                console.warn("⚠️ Geocoded location not in Halifax area, using Halifax center:", {
                  geocoded: { lat, lng },
                  using: { lat: halifaxCenterLat, lng: halifaxCenterLng }
                });
              }
              lat = halifaxCenterLat;
              lng = halifaxCenterLng;
            }
          }

          // Verify it's actually in Canada (Nova Scotia region)
          const isInNovaScotia = lat >= 43.0 && lat <= 47.0 && lng >= -66.5 && lng <= -59.0;

          if (!isInNovaScotia) {
            // If the search location is outside Nova Scotia, do not override the map view.
            // This keeps the map focused on the listed properties (which are Nova Scotia-based).
            if (process.env.NODE_ENV === "development") {
              console.warn("⚠️ Geocoded location is outside Nova Scotia bounds (ignoring):", { lat, lng, formattedAddress });
            }
            return;
          }

          // ALWAYS show search location marker (user searched for this location)
          setSearchLocation({
            lat,
            lng,
            address: formattedAddress
          });

          // Mark that geocoding is complete - this will allow listings effect to proceed
          zoomSetRef.current = true;

          // Check if it's a street/road search - use higher zoom for better visibility
          const isStreetSearch = addressLower.includes('street') || addressLower.includes('road') ||
            addressLower.includes('drive') || addressLower.includes('avenue') ||
            addressLower.includes('boulevard') || addressLower.includes('highway') ||
            addressLower.includes('lane') || addressLower.includes('way') ||
            addressLower.includes('bay') || addressLower.includes('cove');

          const targetZoom = isStreetSearch ? 18 : 15; // Moderate zoom for city, high for street

          // Pan to EXACT search location and zoom in IMMEDIATELY to show the road/location
          // Use setCenter + setZoom for precise control (not fitBounds)
          mapRef.current.setCenter({ lat, lng });
          ignoreNextBoundsUpdateRef.current = true;
          mapRef.current.setZoom(targetZoom);
          setZoomLevel(targetZoom);

          // Ensure map type persists
          const currentMapType = mapRef.current.getMapTypeId();
          if (currentMapType) {
            mapRef.current.setMapTypeId(currentMapType);
          }
        } else {
          // Geocoding failed - silently handle (don't show errors to user)
          // Restore console in case of error
          console.error = originalError;
          console.warn = originalWarn;
          // Don't log geocoding failures - they're handled gracefully
        }
      }
    );

    // Cleanup: clear search location when search query is removed
    return () => {
      if (!searchQuery) {
        setSearchLocation(null);
        zoomSetRef.current = false; // Reset zoom flag when search clears
      }
    };
  }, [searchQuery, isLoaded]); // Only run when searchQuery changes!!

  // Map viewport is driven by user interaction and searches, NOT by the properties list.

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
                  <br />3. Under &quot;Application restrictions&quot;, add:
                  <br />   • <code className="bg-gray-200 px-1 rounded">http://localhost:3000/*</code>
                  <br />   • <code className="bg-gray-200 px-1 rounded">http://localhost:3001/*</code>
                  <br />   • Your production domain (e.g., <code className="bg-gray-200 px-1 rounded">https://yourdomain.com/*</code>)
                  <br />4. Click &quot;Save&quot; and wait 1-2 minutes
                  <br />5. Refresh this page
                </p>
              </>
            ) : (
              <>
                <p>The Google Maps API key is invalid or not properly configured.</p>
                <p className="text-xs text-gray-500">
                  Please verify:
                  <br />1. The API key is correct in <code className="bg-gray-200 px-1 rounded">.env.local</code>
                  <br />2. &quot;Maps JavaScript API&quot; is enabled in Google Cloud Console
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

  // Show minimal loading state - faster perceived load
  if (!isLoaded) {
    return (
      <div className="h-full w-full bg-gray-100" style={{ minHeight: '400px' }} />
    );
  }

  return (
    <div
      className="h-full w-full relative"
      id="google-map-container"
      style={{
        minHeight: '400px',
        height: '100%',
        width: '100%',
        position: 'relative',
        touchAction: 'pan-y pinch-zoom' // Allow map gestures on mobile
      }}
    >
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={mapCenter || defaultCenter}
        zoom={zoomLevel}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          zoomControlOptions: { position: 8 },
          scrollwheel: true, // Map zoom with scrollwheel is fine, but container won't scroll
          mapTypeControl: true, // Enable map type control (satellite/roadmap toggle)
          mapTypeControlOptions: {
            position: 3, // Top right
            mapTypeIds: ["roadmap", "satellite", "hybrid"]
          },
          mapTypeId: mapTypeId, // Use tracked map type (preserves user selection)
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: { position: 7 },
          disableDefaultUI: false,
          gestureHandling: "greedy", // Better for mobile - allows single finger pan
          minZoom: 6,
          maxZoom: 20, // Allow higher zoom for better property visibility
          // Smooth rendering
          draggable: true,
          clickableIcons: false,
          keyboardShortcuts: true,
          optimized: true,
          // Mobile-specific optimizations
          disableDoubleClickZoom: false,
          restriction: null, // Remove restrictions for faster load
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
        <MarkerClusterer
          options={{
            gridSize: 60,
            maxZoom: 15,
            styles: [
              {
                textColor: 'white',
                url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ccircle cx="20" cy="20" r="18" fill="%23091d35" stroke="white" stroke-width="2"/%3E%3C/svg%3E',
                height: 40,
                width: 40,
                textSize: 14,
                fontWeight: '700'
              }
            ]
          }}
        >
          {(clusterer) => (
            <>
              {validListings.map((listing, index) => (
                <PriceMarker
                  key={`prop-pin-${listing.ListingId || listing.Id || index}`}
                  listing={listing}
                  clusterer={clusterer}
                  isSelected={selectedId === (listing.ListingId || listing.Id)}
                  onClick={(id) => setSelectedId(selectedId === id ? null : id)}
                />
              ))}
              
              {/* Separate InfoWindow for selected item to avoid Marker re-renders */}
              {selectedId && !String(selectedId).startsWith('search-') && (() => {
                const listing = validListings.find(l => (l.ListingId || l.Id) === selectedId);
                if (!listing) return null;
                
                const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
                const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lng);
                if (isNaN(latNum) || isNaN(lngNum)) return null;

                const isFromSellAPI = listing.MlsStatus === "Sold" || listing.source === 'sell' || listing.ListingId?.startsWith('SELL-');
                const isSold = isFromSellAPI || listing.StandardStatus === 'Closed' || listing.MlsStatus === 'Closed';
                const priceValue = listing.ListPrice || listing.ClosePrice || listing.Price;
                const priceLabel = formatPriceLabel(priceValue) || "N/A";
                const address = listing.UnparsedAddress || listing.AddressLine1 || "No Address";
                const beds = listing.BedroomsTotal || 0;
                const baths = listing.BathroomsTotalInteger || listing.BathroomsTotal || 0;
                const sqft = listing.LivingArea || listing.BuildingAreaTotal || 0;
                const imageUrl = listing.Media?.[0]?.MediaURL || listing.Photos?.[0] || "/images/placeholder.jpg";
                
                const detailUrl = listing.friendlyUrl ? `/properties/${listing.friendlyUrl}`
                  : `/properties/${selectedId}?address=${encodeURIComponent(address)}`;

                return (
                  <InfoWindow
                    position={{ lat: latNum, lng: lngNum }}
                    onCloseClick={() => setSelectedId(null)}
                    options={{
                      maxWidth: 320,
                      pixelOffset: new window.google.maps.Size(0, -34),
                      disableAutoPan: true,
                    }}
                  >
                    <div style={{ width: '300px', maxWidth: '300px', overflow: 'hidden' }} className="p-0 bg-white shadow-xl border border-gray-200">
                      {/* Property Image */}
                      <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#f3f4f6' }}>
                        <img
                          src={imageUrl}
                          alt={address}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                        />
                        <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: isSold ? '#dc2626' : '#091d35', color: 'white', fontSize: '10px', fontWeight: '600', padding: '3px 6px', borderRadius: '3px' }}>
                          {isSold ? 'Sold' : 'For Sale'}
                        </div>
                      </div>

                      {/* Property Details */}
                      <div style={{ padding: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#091D35', marginBottom: '6px', lineHeight: '1.2', marginTop: 0 }}>
                          {priceLabel}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#374151', fontWeight: '600', marginBottom: '10px', lineHeight: '1.3' }}>{address}</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600' }}>{beds}</span>
                          <span>bed{beds !== 1 ? "s" : ""}</span>
                          <span>·</span>
                          <span style={{ fontWeight: '600' }}>{baths}</span>
                          <span>bath{baths !== 1 ? "s" : ""}</span>
                          {sqft ? (
                            <>
                              <span>·</span>
                              <span style={{ fontWeight: '600' }}>{Number(sqft).toLocaleString()}</span>
                              <span>sqft</span>
                            </>
                          ) : null}
                        </div>

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
                            marginTop: 0,
                          }}
                        >
                          View Full Details →
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                );
              })()}
            </>
          )}
        </MarkerClusterer>

        {/* Search Location Marker - Show ONLY when no properties exist at/near the searched location */}
        {(() => {
          // Check if we should show search location marker
          if (!searchLocation || !searchQuery) return null;

          // If no properties, always show search location marker
          let showMarker = false;
          if (validListings.length === 0) {
            showMarker = true;
          } else {
            // Check if any property is very close to the search location (within ~1km)
            const searchLat = searchLocation.lat;
            const searchLng = searchLocation.lng;
            const closeDistance = 0.01; // ~1km - very close

            const hasPropertyNearby = validListings.some((listing) => {
              const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
              const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
              const latNum = lat != null ? parseFloat(lat) : NaN;
              const lngNum = lng != null ? parseFloat(lng) : NaN;

              if (!isNaN(latNum) && !isNaN(lngNum)) {
                const latDiff = Math.abs(latNum - searchLat);
                const lngDiff = Math.abs(lngNum - searchLng);
                const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
                return distance < closeDistance;
              }
              return false;
            });

            // Show search location marker only if NO property is nearby
            showMarker = !hasPropertyNearby;
          }

          if (!showMarker) return null;

          return (
            <Marker
              position={searchLocation}
              icon={{
                url: "data:image/svg+xml," + encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 24 30">' +
                  '<path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 18 12 18s12-9.6 12-18C24 5.4 18.6 0 12 0z" fill="#091d35" stroke="#ffffff" stroke-width="2.5"/>' +
                  '<circle cx="12" cy="12" r="7" fill="#ffffff"/>' +
                  '<circle cx="12" cy="12" r="4" fill="#091d35"/>' +
                  '</svg>'
                ),
                scaledSize: { width: 40, height: 48 },
                anchor: { x: 20, y: 48 },
              }}
              zIndex={1001}
              title={searchLocation.address || searchQuery}
              onClick={() => {
                // Show InfoWindow when clicked
                setSelectedId(`search-location-${searchQuery}`);
              }}
            >
              {selectedId === `search-location-${searchQuery}` && (
                <InfoWindow
                  position={searchLocation}
                  onCloseClick={() => setSelectedId(null)}
                  options={{
                    maxWidth: 300,
                    pixelOffset: new window.google.maps.Size(0, -10),
                  }}
                >
                  <div className="p-3">
                    <p className="font-bold text-[#091D35] text-base mb-1">
                      Searched Location
                    </p>
                    <p className="text-sm text-gray-700">
                      {searchLocation.address || searchQuery}
                    </p>
                    {validListings.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {validListings.length} propert{validListings.length === 1 ? 'y' : 'ies'} found nearby
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })()}
      </GoogleMap>
    </div>
  );
});