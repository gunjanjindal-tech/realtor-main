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

// Blue dot marker for available properties
const BLUE_DOT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/></svg>'
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

// Blue pinpoint icon as data URL for Google Marker
const BLUE_PINPOINT_ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 30">' +
    '<path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 18 12 18s12-9.6 12-18C24 5.4 18.6 0 12 0z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>' +
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
const ZOOM_CITY_LEVEL = 9; // zoom < this: show only city markers (very zoomed out)
const ZOOM_PROPERTY_LEVEL = 12; // zoom >= this: show all individual properties (hide city markers)

// Static libraries array to prevent LoadScript reload warning
// Note: "geocoding" is not included to avoid errors if API key doesn't have Geocoding API enabled
const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

export default function PropertyListingsMapGoogle({ listings = [], mapCenter = {}, onBoundsChange, searchQuery, hasSearchResults = false, onMapClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedCityKey, setSelectedCityKey] = useState(null);
  const [mapTypeId, setMapTypeId] = useState("roadmap"); // Default to roadmap view
  const [searchLocation, setSearchLocation] = useState(null); // Geocoded point for roads/areas
  const mapRef = useRef(null);
  const isZoomingToSearchRef = useRef(false); // Flag to prevent other zoom logic from interfering

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
    () =>
      listings.filter((l) => {
        const lat = l.Latitude || l.LatitudeDecimal;
        const lng = l.Longitude || l.LongitudeDecimal;
        return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
      }),
    [listings]
  );

  // Location-based clustering: group nearby properties together
  // Dynamic cluster distance based on zoom level - larger clusters when zoomed out
  const getClusterDistance = (zoom) => {
    if (zoom <= 7) return 0.02; // Very zoomed out: ~15km clusters
    if (zoom <= 8) return 0.10; // Zoomed out: ~10km clusters
    if (zoom <= 9) return 0.08; // Medium zoom: ~8km clusters
    return 0.05; // Closer zoom: ~5km clusters
  };

  const clusters = useMemo(() => {
    if (validListings.length === 0) return [];

    const clusterDistance = getClusterDistance(zoomLevel);
    const clustered = [];
    const used = new Set();

    validListings.forEach((listing, index) => {
      if (used.has(index)) return;

      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
      if (isNaN(lat) || isNaN(lng)) return;

      // Find all nearby properties within cluster distance
      const nearby = [listing];
      const nearbyIndices = [index];

      validListings.forEach((other, otherIndex) => {
        if (otherIndex === index || used.has(otherIndex)) return;

        const otherLat = parseFloat(other.Latitude || other.LatitudeDecimal);
        const otherLng = parseFloat(other.Longitude || other.LongitudeDecimal);
        if (isNaN(otherLat) || isNaN(otherLng)) return;

        // Calculate distance (simple Euclidean distance in degrees)
        const latDiff = Math.abs(lat - otherLat);
        const lngDiff = Math.abs(lng - otherLng);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (distance <= clusterDistance) {
          nearby.push(other);
          nearbyIndices.push(otherIndex);
        }
      });

      // Mark all as used
      nearbyIndices.forEach(idx => used.add(idx));

      // Calculate cluster center
      const sumLat = nearby.reduce((sum, l) => sum + parseFloat(l.Latitude || l.LatitudeDecimal || 0), 0);
      const sumLng = nearby.reduce((sum, l) => sum + parseFloat(l.Longitude || l.LongitudeDecimal || 0), 0);
      const center = {
        lat: sumLat / nearby.length,
        lng: sumLng / nearby.length
      };

      clustered.push({
        key: `cluster-${index}`,
        listings: nearby,
        center,
        count: nearby.length,
        cityName: nearby[0]?.City || "Area"
      });
    });

    return clustered;
  }, [validListings, zoomLevel]);

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
  // - Zoom < 11: Show clusters (combined nearby properties) - fewer numbers, bigger clusters
  // - Zoom >= 11: Show ALL individual properties (no clusters, show individual dots/icons)
  // After search, always show individual properties (don't cluster) so user can see search results
  const showClusters = useMemo(() => {
    return zoomLevel < 11 && validListings.length > 10 && !searchQuery; // Don't cluster when searching
  }, [zoomLevel, validListings.length, searchQuery]);

  // Show clusters when zoomed out, individual properties when zoomed in
  // Always show properties when there's a search query (even when zoomed out)
  const displayedListings = useMemo(() => {
    if (showClusters) return []; // Clusters will be shown instead
    // Show ALL properties when zoomed in OR when there's a search query
    return validListings;
  }, [validListings, showClusters]);

  const onLoad = useCallback(
    (map) => {
      if (!map) return;
      mapRef.current = map;
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom || 10);

      // Set default map type to roadmap (not satellite)
      map.setMapTypeId("roadmap");
      setMapTypeId("roadmap");

      // Fast initialization - minimal setup
      // Skip if we're currently zooming to a search location
      if (!isZoomingToSearchRef.current) {
        if (validListings.length === 1) {
          const listing = validListings[0];
          const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
          const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
          if (!isNaN(lat) && !isNaN(lng)) {
            map.setCenter({ lat, lng });
            map.setZoom(17);
          }
        } else if (validListings.length > 0) {
          // Quick center - no complex calculations
          map.setCenter(center);
          map.setZoom(8);
          setZoomLevel(8);
        }
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
    [onBoundsChange, mapCenter, validListings.length, onMapClick]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // ALWAYS geocode search query first to show exact searched location
  // Then show properties if available, but keep focus on searched location
  // This effect runs whenever searchQuery changes to immediately zoom to searched location
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !searchQuery) {
      if (process.env.NODE_ENV === "development" && searchQuery) {
        console.log("🔍 [MAP] Search query exists but map not ready:", {
          hasMapRef: !!mapRef.current,
          isLoaded,
          searchQuery
        });
      }
      // Reset flag when no search query
      isZoomingToSearchRef.current = false;
      return;
    }

    const searchAddress = searchQuery.trim();
    if (!searchAddress) {
      isZoomingToSearchRef.current = false;
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [MAP] Geocoding search query:", searchAddress);
    }

    // Clear previous search location marker when new search happens
    setSearchLocation(null);

    // ALWAYS geocode the search query to show exact searched location
    // Note: Geocoding is optional - if API is not enabled, map will still work
    if (window.google?.maps?.Geocoder) {
      // Store original console functions outside try block for catch block access
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalLog = console.log;

      try {
        // Completely suppress geocoding-related errors
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

        const geocoder = new window.google.maps.Geocoder();

        // Try multiple geocoding strategies for better results - works for any location name
        const geocodeAttempts = [
          `${searchAddress}, Nova Scotia, Canada`,
          `${searchAddress}, Nova Scotia`,
          searchAddress
        ];

        let attemptIndex = 0;

        const tryGeocode = (address) => {
          // Suppress errors during geocode call
          suppressGeocodingErrors();

          geocoder.geocode(
            {
              address: address,
              region: "ca",
            },
            (results, status) => {
              // Restore console immediately after callback
              console.error = originalError;
              console.warn = originalWarn;
              console.log = originalLog;

              if (status !== window.google.maps.GeocoderStatus.OK) {
                attemptIndex++;
                if (attemptIndex < geocodeAttempts.length) {
                  tryGeocode(geocodeAttempts[attemptIndex]);
                }
                // Silently fail if all attempts fail - geocoding is optional
                return;
              }

              // Console already restored above
              if (results && results.length > 0 && mapRef.current) {
                const result = results[0];
                const location = result.geometry.location;
                const bounds = result.geometry.bounds;
                const viewport = result.geometry.viewport;

                // Always set a marker at the geocoded point so user sees where the road/area is
                const centerPoint = location ||
                  (viewport ? viewport.getCenter() : null) ||
                  (bounds ? bounds.getCenter() : null);
                if (centerPoint) {
                  setSearchLocation({ lat: centerPoint.lat(), lng: centerPoint.lng() });
                }

                // PRIORITY: Always zoom to search location first with high zoom
                // Then adjust if properties exist
                const zoomToSearchLocation = () => {
                  if (!mapRef.current) {
                    if (process.env.NODE_ENV === "development") {
                      console.warn("🔍 [MAP] Cannot zoom - mapRef.current is null");
                    }
                    return;
                  }

                  // Set flag to prevent other zoom logic from interfering
                  isZoomingToSearchRef.current = true;

                  if (process.env.NODE_ENV === "development") {
                    console.log("🔍 [MAP] Zooming to search location:", { hasBounds: !!bounds, hasViewport: !!viewport, hasLocation: !!location });
                  }

                  if (bounds) {
                    // For bounds, center first then zoom
                    const center = bounds.getCenter();
                    mapRef.current.setCenter({ lat: center.lat(), lng: center.lng() });

                    // Set zoom immediately to high level
                    mapRef.current.setZoom(17);
                    setZoomLevel(17);

                    if (process.env.NODE_ENV === "development") {
                      console.log("🔍 [MAP] Zoomed to bounds location at zoom 17");
                    }

                    // Also fit bounds with small padding for context, but keep zoom high
                    mapRef.current.fitBounds(bounds, { padding: 10 });

                    // Force zoom again after fitBounds (it might reduce zoom)
                    const forceZoom = () => {
                      if (mapRef.current) {
                        const currentZoom = mapRef.current.getZoom();
                        if (currentZoom < 17) {
                          mapRef.current.setZoom(17);
                          setZoomLevel(17);
                          if (process.env.NODE_ENV === "development") {
                            console.log("🔍 [MAP] Forced zoom back to 17");
                          }
                        }
                      }
                    };

                    // Try multiple times to ensure zoom sticks
                    setTimeout(forceZoom, 50);
                    setTimeout(forceZoom, 150);
                    setTimeout(forceZoom, 300);

                    const zoomListener = mapRef.current.addListener("idle", () => {
                      forceZoom();
                      setTimeout(() => {
                        isZoomingToSearchRef.current = false;
                      }, 500);
                      if (mapRef.current && zoomListener) {
                        window.google.maps.event.removeListener(zoomListener);
                      }
                    });
                  } else if (viewport) {
                    // For viewport, center first then zoom
                    const center = viewport.getCenter();
                    mapRef.current.setCenter({ lat: center.lat(), lng: center.lng() });

                    // Set zoom immediately to high level
                    mapRef.current.setZoom(17);
                    setZoomLevel(17);

                    // Also fit viewport with small padding
                    mapRef.current.fitBounds(viewport, { padding: 10 });

                    const forceZoom = () => {
                      if (mapRef.current) {
                        const currentZoom = mapRef.current.getZoom();
                        if (currentZoom < 17) {
                          mapRef.current.setZoom(17);
                          setZoomLevel(17);
                        }
                      }
                    };

                    setTimeout(forceZoom, 50);
                    setTimeout(forceZoom, 150);
                    setTimeout(forceZoom, 300);

                    const zoomListener = mapRef.current.addListener("idle", () => {
                      forceZoom();
                      setTimeout(() => {
                        isZoomingToSearchRef.current = false;
                      }, 500);
                      if (mapRef.current && zoomListener) {
                        window.google.maps.event.removeListener(zoomListener);
                      }
                    });
                  } else if (location) {
                    // Point location - zoom directly to high level
                    mapRef.current.setCenter({ lat: location.lat(), lng: location.lng() });
                    mapRef.current.setZoom(18);
                    setZoomLevel(18);
                    if (process.env.NODE_ENV === "development") {
                      console.log("🔍 [MAP] Zoomed to point location at zoom 18");
                    }
                    setTimeout(() => {
                      isZoomingToSearchRef.current = false;
                    }, 500);
                  }
                };

                // ALWAYS zoom to search location first with high zoom
                // This ensures search location is always visible and zoomed in
                zoomToSearchLocation();

                // If we have properties, adjust view to include them but keep search location priority
                if (hasSearchResults && validListings.length > 0 && !searchLocation) {
                  const propertyBounds = new window.google.maps.LatLngBounds();
                  let hasPropertyCoords = false;

                  validListings.forEach((listing) => {
                    const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
                    const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      propertyBounds.extend({ lat, lng });
                      hasPropertyCoords = true;
                    }
                  });

                  // After zooming to search location, adjust to include properties if they're nearby
                  // But only if properties are close to search location (within reasonable distance)
                  if (hasPropertyCoords && !propertyBounds.isEmpty() && centerPoint) {
                    // Check if properties are close to search location
                    let propertiesNearSearch = false;
                    const searchLat = centerPoint.lat();
                    const searchLng = centerPoint.lng();

                    validListings.forEach((listing) => {
                      const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
                      const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        // Calculate distance (rough estimate in degrees)
                        const latDiff = Math.abs(lat - searchLat);
                        const lngDiff = Math.abs(lng - searchLng);
                        // If within ~0.1 degrees (~11km), consider them close
                        if (latDiff < 0.1 && lngDiff < 0.1) {
                          propertiesNearSearch = true;
                        }
                      }
                    });

                    // Only adjust bounds if properties are near search location
                    // Otherwise, keep zoomed in on search location
                    if (propertiesNearSearch) {
                      // Include search location in bounds
                      if (bounds) {
                        propertyBounds.union(bounds);
                      } else if (viewport) {
                        propertyBounds.union(viewport);
                      } else if (location) {
                        propertyBounds.extend({ lat: location.lat(), lng: location.lng() });
                      }

                      // Use smaller padding to keep zoom closer
                      mapRef.current.fitBounds(propertyBounds, { padding: 30 });

                      // Force minimum zoom to 15 to keep search location visible
                      const setZoomAfterFit = () => {
                        if (mapRef.current) {
                          const currentZoom = mapRef.current.getZoom();
                          if (currentZoom < 15) {
                            mapRef.current.setZoom(15);
                            setZoomLevel(15);
                          } else {
                            setZoomLevel(currentZoom);
                          }
                        }
                      };

                      setTimeout(setZoomAfterFit, 100);
                      setTimeout(setZoomAfterFit, 300);
                      const zoomListener = mapRef.current.addListener("idle", () => {
                        setZoomAfterFit();
                        if (mapRef.current && zoomListener) {
                          window.google.maps.event.removeListener(zoomListener);
                        }
                      });
                    }
                    // If properties are far, don't adjust - keep zoomed on search location
                  }
                }

                // Trigger bounds change after geocoding zoom so nearby properties can be fetched
                // Use multiple strategies to ensure bounds are reported reliably
                if (mapRef.current && onBoundsChange) {
                  const reportBounds = () => {
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
                  };

                  // Fast bounds reporting - immediate and on idle
                  // Strategy 1: Report with small delay to ensure bounds are ready
                  setTimeout(reportBounds, 50);

                  // Strategy 2: Report on idle event (ensures accuracy after map renders)
                  let idleListener = null;
                  if (mapRef.current) {
                    idleListener = mapRef.current.addListener("idle", () => {
                      reportBounds();
                      // Remove listener after first idle event
                      if (mapRef.current && idleListener) {
                        window.google.maps.event.removeListener(idleListener);
                      }
                    });
                  }
                }
              }
              // If all attempts fail, silently continue - geocoding is optional
            });
        };

        // Start with first geocoding attempt
        tryGeocode(geocodeAttempts[0]);
      } catch (error) {
        // Silently ignore all geocoding errors - geocoding is optional
        // Restore console in case of exception
        console.error = originalError;
        console.warn = originalWarn;
        console.log = originalLog;
      }
    } else {
      // Geocoding API not available - map will still work without search location marker
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 [MAP] Geocoding API not available - search location marker disabled");
      }
    }
  }, [searchQuery, isLoaded, validListings, hasSearchResults, onBoundsChange]);

  // Update map center and zoom when listings change (only if no search query)
  useEffect(() => {
    if (mapRef.current && validListings.length > 0 && !searchQuery) {
      // Only auto-fit if not searching (search geocoding handles that)
      if (validListings.length === 1) {
        // Single property: zoom to it
        const listing = validListings[0];
        const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
        const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
        if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(14); // Zoom in closer for single property
        }
      } else if (validListings.length > 1) {
        // Multiple properties: fit bounds to show all
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidCoords = false;

        validListings.forEach((listing) => {
          const lat = parseFloat(listing.Latitude || listing.LatitudeDecimal);
          const lng = parseFloat(listing.Longitude || listing.LongitudeDecimal);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng });
            hasValidCoords = true;
          }
        });

        if (hasValidCoords && mapRef.current) {
          const currentMapType = mapRef.current.getMapTypeId();
          mapRef.current.fitBounds(bounds, { padding: 50 });
          // Preserve map type after fitBounds
          if (currentMapType) {
            mapRef.current.setMapTypeId(currentMapType);
          }
        }
      }
    }
  }, [validListings, searchQuery]);

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

            return (
              <Marker
                key={id}
                position={{ lat, lng }}
                icon={{
                  url: markerIcon,
                  scaledSize: iconSize,
                  anchor: iconAnchor,
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
                          <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: isFromSellAPI ? '#f97316' : (isSold ? '#dc2626' : '#2563eb'), color: 'white', fontSize: '10px', fontWeight: '600', padding: '3px 6px', borderRadius: '3px' }}>
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

        {/* Search Location Marker - Shows where the searched road/area is */}
        {searchLocation && !hasSearchResults && searchQuery && (
          <Marker
            position={searchLocation}
            icon={{
              url: "data:image/svg+xml," + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 30">' +
                '<path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 18 12 18s12-9.6 12-18C24 5.4 18.6 0 12 0z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>' +
                '<circle cx="12" cy="12" r="6" fill="#ffffff"/>' +
                '</svg>'
              ),
              scaledSize: { width: 32, height: 40 },
              anchor: { x: 16, y: 40 },
            }}
            zIndex={1000}
          >
            <InfoWindow position={searchLocation}>
              <div className="p-2 min-w-[200px]">
                <p className="font-bold text-[#091D35] text-sm mb-1">
                  Searched Location
                </p>
                <p className="text-xs text-gray-700">
                  {searchQuery}
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Showing nearby properties
                </p>
              </div>
            </InfoWindow>
          </Marker>
        )}
      </GoogleMap>
    </div>
  );
}