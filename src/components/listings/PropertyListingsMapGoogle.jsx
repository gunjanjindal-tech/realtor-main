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

// Navy blue dot marker for available properties
const BLUE_DOT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#091d35" stroke="#ffffff" stroke-width="1.5"/></svg>'
  );

// Red dot marker for sold properties (from buy API with sold status)
const RED_DOT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#dc2626" stroke="#ffffff" stroke-width="1.5"/></svg>'
  );

// Orange dot marker for sold properties from sell API
const ORANGE_DOT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#f97316" stroke="#ffffff" stroke-width="1.5"/></svg>'
  );

// Legacy dot marker (default blue for backward compatibility)
const DOT_ICON_SVG = BLUE_DOT_ICON_SVG;

// Navy blue pinpoint icon as data URL for Google Marker
const BLUE_PINPOINT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 30">' +
    '<path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 18 12 18s12-9.6 12-18C24 5.4 18.6 0 12 0z" fill="#091d35" stroke="#ffffff" stroke-width="2"/>' +
    '<circle cx="12" cy="12" r="6" fill="#ffffff"/>' +
    '</svg>'
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
const ZOOM_CITY_LEVEL = 13; // zoom < this: show only city markers (very zoomed out)
const ZOOM_PROPERTY_LEVEL = 20; // zoom >= this: show all individual properties (hide city markers)

// Static libraries array to prevent LoadScript reload warning
// Geocoding is included since it's enabled on the API key
const GOOGLE_MAPS_LIBRARIES = ["places", "geometry", "geocoding"];

export default function PropertyListingsMapGoogle({ listings = [], mapCenter = {}, onBoundsChange, searchQuery, hasSearchResults = false, onMapClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedCityKey, setSelectedCityKey] = useState(null);
  const [mapTypeId, setMapTypeId] = useState("roadmap"); // Default to roadmap view
  const [searchLocation, setSearchLocation] = useState(null); // Geocoded point for roads/areas
  const mapRef = useRef(null);
  const zoomSetRef = useRef(false); // Track if zoom has been set for current search

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

      // Debug logging for search (only in development, and only once per search)
      if (process.env.NODE_ENV === "development" && searchQuery && searchQuery.trim().length > 0) {
        // Only log if this is a new search (not on every render)
        const searchKey = `${searchQuery}-${filtered.length}`;
        if (!window._lastSearchLog || window._lastSearchLog !== searchKey) {
          window._lastSearchLog = searchKey;
          console.log("🗺️ Map Component - Valid Listings:", {
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

  // Smart clustering: group properties by city, then merge nearby cities when zoomed out
  // This creates fewer dots that expand when zooming in
  const clusters = useMemo(() => {
    if (validListings.length === 0) return [];

    // First, group properties by city
    const cityGroups = new Map();

    validListings.forEach((listing) => {
      // Check multiple possible coordinate field names
      const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
      const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
      const latNum = lat != null ? parseFloat(lat) : NaN;
      const lngNum = lng != null ? parseFloat(lng) : NaN;
      if (isNaN(latNum) || isNaN(lngNum)) return;

      // Get city name (normalize to handle variations)
      const cityName = (listing.City || "Unknown").trim();
      const cityKey = cityName.toLowerCase();

      if (!cityGroups.has(cityKey)) {
        cityGroups.set(cityKey, {
          cityName,
          listings: [],
          latSum: 0,
          lngSum: 0,
          count: 0
        });
      }

      const group = cityGroups.get(cityKey);
      group.listings.push(listing);
      group.latSum += latNum;
      group.lngSum += lngNum;
      group.count += 1;
    });

    // Calculate city centers
    const cityCenters = [];
    cityGroups.forEach((group, cityKey) => {
      const center = {
        lat: group.latSum / group.count,
        lng: group.lngSum / group.count
      };
      cityCenters.push({
        key: cityKey,
        cityName: group.cityName,
        center,
        listings: group.listings,
        count: group.count
      });
    });

    // If zoomed out very far (zoom < 10), merge nearby cities into larger clusters
    // This creates fewer dots
    if (zoomLevel < 10 && cityCenters.length > 1) {
      const mergedClusters = [];
      const used = new Set();
      const clusterDistance = 0.15; // ~15km - merge cities within this distance

      cityCenters.forEach((city, index) => {
        if (used.has(index)) return;

        const cluster = {
          key: `merged-cluster-${index}`,
          listings: [...city.listings],
          latSum: city.center.lat * city.count,
          lngSum: city.center.lng * city.count,
          count: city.count,
          cityNames: [city.cityName]
        };

        // Find nearby cities to merge
        cityCenters.forEach((otherCity, otherIndex) => {
          if (otherIndex === index || used.has(otherIndex)) return;

          const latDiff = Math.abs(city.center.lat - otherCity.center.lat);
          const lngDiff = Math.abs(city.center.lng - otherCity.center.lng);
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          if (distance <= clusterDistance) {
            cluster.listings.push(...otherCity.listings);
            cluster.latSum += otherCity.center.lat * otherCity.count;
            cluster.lngSum += otherCity.center.lng * otherCity.count;
            cluster.count += otherCity.count;
            cluster.cityNames.push(otherCity.cityName);
            used.add(otherIndex);
          }
        });

        used.add(index);
        mergedClusters.push({
          key: cluster.key,
          listings: cluster.listings,
          center: {
            lat: cluster.latSum / cluster.count,
            lng: cluster.lngSum / cluster.count
          },
          count: cluster.count,
          cityName: cluster.cityNames.length === 1
            ? cluster.cityNames[0]
            : `${cluster.cityNames[0]} & ${cluster.cityNames.length - 1} more`
        });
      });

      return mergedClusters;
    }

    // If zoomed in more (zoom >= 10), show city-based clusters (one dot per city)
    return cityCenters.map(city => ({
      key: `city-cluster-${city.key}`,
      listings: city.listings,
      center: city.center,
      count: city.count,
      cityName: city.cityName
    }));
  }, [validListings, zoomLevel]);

  const center = useMemo(
    () => ({ lat: mapCenter?.lat ?? defaultCenter.lat, lng: mapCenter?.lng ?? defaultCenter.lng }),
    [mapCenter]
  );

  const zoom = useMemo(() => {
    if (validListings.length === 0) return 8; // Zoomed out view
    if (validListings.length === 1) return 12; // Single property: moderate zoom
    // When searching, start with a zoom level that shows individual markers (zoom >= 12)
    if (searchQuery && searchQuery.trim().length > 0) {
      return 12; // Zoom in enough to show individual markers when searching
    }
    // For multiple properties (not searching), start zoomed out to show city markers
    return 8; // Start zoomed out (shows city markers by default)
  }, [validListings.length, searchQuery]);

  // Progressive zoom levels:
  // - Zoom < 10: Show merged clusters (nearby cities grouped together) - fewer dots
  // - Zoom 10-11: Show city clusters (one dot per city)
  // - Zoom >= 12: Show ALL individual properties (no clusters, show individual dots/icons)
  // After search, ALWAYS show individual properties (don't cluster) so user can see search results
  const showClusters = useMemo(() => {
    // NEVER show clusters when searching - always show individual markers
    if (searchQuery && searchQuery.trim().length > 0) {
      return false; // Always show individual markers when searching
    }
    // Show clusters when zoomed out AND not searching AND have multiple properties
    return zoomLevel < 12 && validListings.length > 1;
  }, [zoomLevel, validListings.length, searchQuery]);

  // Show clusters when zoomed out, individual properties when zoomed in
  // ALWAYS show individual properties when there's a search query (even when zoomed out)
  const displayedListings = useMemo(() => {
    // When searching, ALWAYS show individual markers regardless of zoom level
    if (searchQuery && searchQuery.trim().length > 0) {
      return validListings; // Always show all search results as individual markers
    }
    if (showClusters) return []; // Clusters will be shown instead
    // Show ALL properties when zoomed in
    return validListings;
  }, [validListings, showClusters, searchQuery]);

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
            map.fitBounds(bounds, { padding: 80 });
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
            map.setCenter(center);
            map.setZoom(8);
            setZoomLevel(8);
          }
        }, 100);
      }

      map.addListener("zoom_changed", () => {
        const newZoom = map.getZoom();
        if (newZoom !== null && newZoom !== undefined) {
          setZoomLevel(newZoom);
          // After zoom change, trigger bounds update to ensure properties are visible
          if (onBoundsChange && mapRef.current) {
            // Small delay to ensure map has finished zooming
            setTimeout(() => {
              const b = mapRef.current?.getBounds();
              if (b) {
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
              }
            }, 100);
          }
        }
        // Preserve map type when zooming - don't let it change automatically
        const currentMapType = map.getMapTypeId();
        if (currentMapType && currentMapType !== mapTypeId) {
          // Only update if user manually changed it, otherwise preserve
          setMapTypeId(currentMapType);
        }
      });

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
        report();
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
                bestResult = result;
                break;
              }
              // Otherwise, use first Canada result
              if (bestResult === results[0] || !bestResult.address_components?.find(c => c.types.includes("country") && c.short_name === "CA")) {
                bestResult = result;
              }
            }
          }

          const location = bestResult.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const formattedAddress = bestResult.formatted_address || searchAddress;

          // Verify it's actually in Canada (Nova Scotia region)
          const isInNovaScotia = lat >= 43.0 && lat <= 47.0 && lng >= -66.5 && lng <= -59.0;

          if (!isInNovaScotia && process.env.NODE_ENV === "development") {
            console.warn("⚠️ Geocoded location is outside Nova Scotia bounds:", { lat, lng, formattedAddress });
          }

          // Mark that geocoding is complete - this will allow listings effect to proceed
          zoomSetRef.current = true;

          // Only show search location marker if NO properties found
          // If properties exist, don't show search marker - only show property markers
          if (validListings.length === 0) {
            // Show search location marker only when no properties found
            setSearchLocation({
              lat,
              lng,
              address: formattedAddress
            });
            // Check if it's a street/road search - use higher zoom for better visibility
            const isStreetSearch = addressLower.includes('street') || addressLower.includes('road') ||
              addressLower.includes('drive') || addressLower.includes('avenue') ||
              addressLower.includes('boulevard') || addressLower.includes('highway') ||
              addressLower.includes('lane') || addressLower.includes('way') ||
              addressLower.includes('bay') || addressLower.includes('cove');

            const targetZoom = isStreetSearch ? 18 : 20;

            // Pan to search location and zoom in IMMEDIATELY
            mapRef.current.panTo({ lat, lng });
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.setZoom(targetZoom);
                setZoomLevel(targetZoom);
              }
            }, 100);
            return; // Done - no properties to show
          }

          // If properties exist, don't show search location marker - only show property markers
          // Clear search location if it was set before
          setSearchLocation(null);

          // If properties exist, just pan to location - let listings effect handle zoom with fitBounds
          // This prevents zoom conflicts and fluctuation
          mapRef.current.panTo({ lat, lng });

          // Trigger bounds update for property loading (listings effect will handle zoom)
          if (onBoundsChange && mapRef.current) {
            const bounds = mapRef.current.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              onBoundsChange({
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng()
              });
            }
          }
        } else {
          // Geocoding failed
          if (process.env.NODE_ENV === "development") {
            console.warn("Geocoding failed:", status, searchAddress);
          }
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
  }, [searchQuery, isLoaded, onBoundsChange, validListings.length, searchLocation?.lat, searchLocation?.lng]);

  // Update map center and zoom when listings change
  // When searching: zoom in to search location. When not searching: show all properties
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // If searching, let the geocoding effect handle zoom FIRST (prevents conflicts)
    if (searchQuery && searchQuery.trim().length > 0) {
      // If no properties, geocoding effect already handled zoom - don't interfere
      if (validListings.length === 0) {
        return; // Geocoding effect already set zoom for no properties case
      }

      // If properties exist, wait for geocoding to complete before adjusting bounds
      if (!zoomSetRef.current || !searchLocation) {
        return; // Wait for geocoding effect to set search location first
      }
    } else {
      // Reset zoom flag when not searching
      zoomSetRef.current = false;
    }

    if (validListings.length === 0) return;

    // If searching and have properties: use fitBounds to show all properties
    // This prevents zoom fluctuation by doing it once
    // Note: searchLocation is not included when properties exist - only property markers are shown
    if (searchQuery && validListings.length > 0 && zoomSetRef.current) {
      // Calculate center from actual properties (more accurate)
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;

      validListings.forEach((listing) => {
        // Check multiple possible coordinate field names
        const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
        const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
        const latNum = lat != null ? parseFloat(lat) : NaN;
        const lngNum = lng != null ? parseFloat(lng) : NaN;
        if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
          bounds.extend({ lat: latNum, lng: lngNum });
          hasValidCoords = true;
        }
      });

      // Don't include search location in bounds when properties exist - only show property markers
      // Search location marker is only shown when no properties are found

      if (hasValidCoords) {
        const currentMapType = mapRef.current.getMapTypeId();

        // Calculate appropriate zoom based on number of properties - increased for more zoom in
        let minZoom;
        if (validListings.length === 1) {
          minZoom = 18; // Single property - zoom in very close
        } else if (validListings.length <= 3) {
          minZoom = 17; // Few properties - zoom in close
        } else if (validListings.length <= 5) {
          minZoom = 16; // Some properties - moderate zoom
        } else {
          minZoom = 15; // Many properties - still zoom in but not too much
        }

        // Fit bounds to show all search results + search location in ONE smooth operation
        // Use reduced padding for better zoom (less padding = more zoom in)
        mapRef.current.fitBounds(bounds, { padding: 30 });

        // After fitBounds, ensure minimum zoom level (prevents zooming out too much)
        // Do this in ONE operation to prevent fluctuation
        setTimeout(() => {
          if (mapRef.current && zoomSetRef.current) {
            const currentZoom = mapRef.current.getZoom();
            // Only adjust if zoomed out too much - don't override if already zoomed in enough
            if (currentZoom && currentZoom < minZoom) {
              mapRef.current.setZoom(minZoom);
              setZoomLevel(minZoom);
            } else if (currentZoom) {
              setZoomLevel(currentZoom);
            }
            // Mark that zoom is complete - prevent further adjustments
            zoomSetRef.current = true;
          }
        }, 200); // Single delay - no multiple adjustments

        if (currentMapType) {
          mapRef.current.setMapTypeId(currentMapType);
        }
        return;
      }
    }

    // Don't run these effects if searching - let search effects handle it
    if (searchQuery && searchQuery.trim().length > 0) {
      return;
    }

    // Single property: zoom to it at moderate level
    if (validListings.length === 1) {
      const listing = validListings[0];
      // Check multiple possible coordinate field names
      const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
      const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
      const latNum = lat != null ? parseFloat(lat) : NaN;
      const lngNum = lng != null ? parseFloat(lng) : NaN;
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const currentMapType = mapRef.current.getMapTypeId();
        mapRef.current.setCenter({ lat: latNum, lng: lngNum });
        mapRef.current.setZoom(14);
        if (currentMapType) {
          mapRef.current.setMapTypeId(currentMapType);
        }
      }
      return;
    }

    // Multiple properties and NOT searching: fit bounds to show ALL properties (as city clusters)
    // Use setTimeout to ensure map is fully ready
    const timeoutId = setTimeout(() => {
      if (!mapRef.current) return;

      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;

      // Add all property locations to bounds
      validListings.forEach((listing) => {
        // Check multiple possible coordinate field names
        const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
        const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
        const latNum = lat != null ? parseFloat(lat) : NaN;
        const lngNum = lng != null ? parseFloat(lng) : NaN;
        if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
          bounds.extend({ lat: latNum, lng: lngNum });
          hasValidCoords = true;
        }
      });

      if (hasValidCoords) {
        try {
          const currentMapType = mapRef.current.getMapTypeId();
          // Fit bounds with padding to ensure all properties are visible
          // When showing clusters, ensure zoom stays below 12 to show city dots
          mapRef.current.fitBounds(bounds, { padding: 80 });

          // If zoomed in too much (above 11), zoom out to show clusters
          setTimeout(() => {
            if (mapRef.current && !searchQuery) {
              const currentZoom = mapRef.current.getZoom();
              if (currentZoom && currentZoom >= 12) {
                // Zoom out to show city clusters
                mapRef.current.setZoom(11);
              }
            }
          }, 100);

          if (currentMapType) {
            mapRef.current.setMapTypeId(currentMapType);
          }
        } catch (error) {
          // If fitBounds fails, try again with a longer delay
          console.warn("fitBounds failed, retrying...", error);
          setTimeout(() => {
            if (mapRef.current) {
              try {
                mapRef.current.fitBounds(bounds, { padding: 80 });
                // Ensure zoom stays below 12 for clusters
                setTimeout(() => {
                  if (mapRef.current && !searchQuery) {
                    const currentZoom = mapRef.current.getZoom();
                    if (currentZoom && currentZoom >= 12) {
                      mapRef.current.setZoom(11);
                    }
                  }
                }, 100);
              } catch (e) {
                console.error("fitBounds retry failed", e);
              }
            }
          }, 200);
        }
      }
    }, 150); // Small delay to ensure map is ready

    return () => clearTimeout(timeoutId);
  }, [validListings, searchQuery, isLoaded]);

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
        center={center}
        zoom={zoom}
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
        {showClusters
          ? clusters.map((cluster) => (
            <Marker
              key={cluster.key}
              position={cluster.center}
              icon={{
                url: createCityIconSVG(cluster.count),
                scaledSize: { width: cluster.count > 50 ? 40 : cluster.count > 20 ? 36 : 32, height: cluster.count > 50 ? 40 : cluster.count > 20 ? 36 : 32 },
                anchor: { x: cluster.count > 50 ? 20 : cluster.count > 20 ? 18 : 16, y: cluster.count > 50 ? 20 : cluster.count > 20 ? 18 : 16 },
              }}
              onClick={() => {
                const isCurrentlySelected = selectedCityKey === cluster.key;
                setSelectedCityKey(isCurrentlySelected ? null : cluster.key);
                // Auto-zoom to cluster when clicked (if not already selected)
                if (mapRef.current && !isCurrentlySelected) {
                  mapRef.current.setCenter(cluster.center);
                  mapRef.current.setZoom(12); // Zoom in to show individual properties
                }
              }}
            >
              {selectedCityKey === cluster.key && (
                <InfoWindow
                  position={cluster.center}
                  onCloseClick={() => setSelectedCityKey(null)}
                >
                  <div className="p-3 min-w-[180px]">
                    <p className="font-bold text-[#091D35] text-base mb-1">
                      {cluster.count} Propert{cluster.count === 1 ? "y" : "ies"}
                    </p>
                    <p className="text-sm text-gray-700 font-medium">
                      {cluster.cityName || "Area"}
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
            // Debug logging removed to prevent excessive re-renders

            // Check multiple possible coordinate field names
            const lat = listing.Latitude || listing.LatitudeDecimal || listing.latitude || listing.lat;
            const lng = listing.Longitude || listing.LongitudeDecimal || listing.longitude || listing.lng || listing.lon;
            const latNum = lat != null ? parseFloat(lat) : NaN;
            const lngNum = lng != null ? parseFloat(lng) : NaN;

            if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
              if (searchQuery && searchQuery.trim().length > 0) {
                console.warn("⚠️ Invalid coordinates for listing:", {
                  id: listing.ListingId || listing.Id,
                  lat: listing.Latitude || listing.LatitudeDecimal,
                  lng: listing.Longitude || listing.LongitudeDecimal
                });
              }
              return null;
            }
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

            // Determine if property is sold or available
            const status = listing.StandardStatus || listing.Status || "";
            const isSold = status.toLowerCase().includes("sold") ||
              status.toLowerCase().includes("closed") ||
              status.toLowerCase().includes("pending");
            const isAvailable = !isSold && (status.toLowerCase().includes("active") ||
              status.toLowerCase().includes("available") ||
              status === "");

            // Check if property is from sell API (sold properties)
            const isFromSellAPI = listing.isFromSellAPI === true;

            // Choose marker icon based on zoom level:
            // - Zoom < 12: Simple dots (blue/red/orange)
            // - Zoom >= 12: Blue pinpoint icon (detailed view)
            const usePinpointIcon = zoomLevel >= 12;

            let markerIcon;
            let iconSize;
            let iconAnchor;

            if (usePinpointIcon) {
              // Use blue pinpoint icon when zoomed in
              markerIcon = BLUE_PINPOINT_ICON_SVG;
              iconSize = { width: 32, height: 40 };
              iconAnchor = { x: 16, y: 40 };
            } else {
              // Use dots when zoomed out
              // Orange for sold properties from sell API
              // Red for sold properties from buy API
              // Blue for available properties
              markerIcon = isFromSellAPI
                ? ORANGE_DOT_ICON_SVG
                : (isSold ? RED_DOT_ICON_SVG : BLUE_DOT_ICON_SVG);
              iconSize = { width: 14, height: 14 };
              iconAnchor = { x: 7, y: 7 };
            }

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

            // Create label text - show street number or short address when zoomed in (zoom >= 16)
            const shortAddress = address.split(',')[0].trim();
            const labelText = zoomLevel >= 16
              ? (streetNum || (shortAddress.length > 20 ? shortAddress.substring(0, 20) + "..." : shortAddress))
              : "";

            return (
              <Marker
                key={id}
                position={{ lat: latNum, lng: lngNum }}
                icon={{
                  url: markerIcon,
                  scaledSize: iconSize,
                  anchor: iconAnchor,
                }}
                label={labelText ? {
                  text: labelText,
                  color: "#091D35",
                  fontSize: "11px",
                  fontWeight: "600",
                  className: "property-label"
                } : undefined}
                onClick={() => {
                  setSelectedId(selectedId === id ? null : id);
                }}
                cursor="pointer"
              >
                {selectedId === id && (
                  <InfoWindow
                    position={{ lat: latNum, lng: lngNum }}
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
                          <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: isFromSellAPI ? '#f97316' : (isSold ? '#dc2626' : '#091d35'), color: 'white', fontSize: '10px', fontWeight: '600', padding: '3px 6px', borderRadius: '3px' }}>
                            {isFromSellAPI ? 'Sold (Sell API)' : (isSold ? 'Sold' : 'For Sale')}
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

        {/* Search Location Marker - Show when searching (even if properties exist, so user can see searched location) */}
        {searchLocation && searchQuery && (
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
        )}
      </GoogleMap>
    </div>
  );
}