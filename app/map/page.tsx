'use client';

import { Feature, Map as OlMap, View, Overlay } from 'ol';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { HistoricalLocation } from './types';
import { getLocations } from './utils/storage';
import { MapPopup } from './components/MapPopup';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Pin icon SVG as data URL for historical events (module scope - created once)
const EVENT_PIN_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#3b82f6" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`)}`;

// Home marker and layer (module scope - created once, don't depend on props/state)
const homeMarker = new Feature({
  geometry: new Point(fromLonLat([-111.8864, 40.7444])),
});
homeMarker.setStyle(
  new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      scale: 0.07,
    }),
  })
);
const homeVectorLayer = new VectorLayer({
  source: new VectorSource({
    features: [homeMarker],
  }),
});
homeVectorLayer.set('layerId', 'home');

function MapContent(): JSX.Element {
  const mapRef = useRef<OlMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const eventsLayerRef = useRef<VectorLayer | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredLocationIdRef = useRef<string | null>(null);

  const [locations, setLocations] = useState<HistoricalLocation[]>([]);
  const [hoveredLocation, setHoveredLocation] = useState<HistoricalLocation | null>(null);
  const [showHomeMarker, setShowHomeMarker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isPinnedRef = useRef(false);

  // Get search params to detect navigation from import page
  const searchParams = useSearchParams();
  const refreshKey = searchParams.get('t');

  // Keep refs in sync with state to avoid stale closures in event handlers
  useEffect(() => {
    hoveredLocationIdRef.current = hoveredLocation?.id ?? null;
  }, [hoveredLocation]);

  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  // Notify layout of fullscreen changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('map-fullscreen-change', { detail: isFullscreen }));
  }, [isFullscreen]);

  // Load locations from localStorage on mount and when refreshKey changes (from import navigation)
  useEffect(() => {
    const loadedLocations = getLocations();
    console.log('[Map] Loading locations, refreshKey:', refreshKey, 'found:', loadedLocations.length);
    setLocations(loadedLocations);
  }, [refreshKey]);

  // Create map and event features
  useEffect(() => {
    if (!mapContainerRef.current || !popupRef.current) return;

    // Create overlay for popup
    const overlay = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
    overlayRef.current = overlay;

    // Create event marker features
    const eventFeatures = locations.map((location) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(location.coordinates)),
        locationId: location.id,
        locationData: location,
      });
      feature.setStyle(
        new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: EVENT_PIN_SVG,
            scale: 1,
          }),
        })
      );
      return feature;
    });

    const eventsLayer = new VectorLayer({
      source: new VectorSource({
        features: eventFeatures,
      }),
    });
    eventsLayer.set('layerId', 'events');
    eventsLayerRef.current = eventsLayer;

    // Create map
    const map = new OlMap({
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
          }),
        }),
        eventsLayer,
      ],
      overlays: [overlay],
      view: new View({
        center: fromLonLat([-111.8881, 40.7606]),
        zoom: 8,
      }),
      target: mapContainerRef.current,
    });
    mapRef.current = map;

    // Handle pointer move for hover detection
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;

      // Clear any pending hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      const pixel = map.getEventPixel(evt.originalEvent);
      const feature = map.forEachFeatureAtPixel(pixel, (f) => f, {
        layerFilter: (layer) => layer.get('layerId') === 'events',
      });

      // If popup is pinned, don't change it on hover - just update cursor
      if (isPinnedRef.current) {
        map.getTargetElement().style.cursor = feature ? 'pointer' : '';
        return;
      }

      if (feature) {
        const locationData = feature.get('locationData') as HistoricalLocation;
        // Use ref instead of state to avoid stale closure
        if (locationData && locationData.id !== hoveredLocationIdRef.current) {
          setHoveredLocation(locationData);
          const coords = fromLonLat(locationData.coordinates);
          overlay.setPosition(coords);
        }
        map.getTargetElement().style.cursor = 'pointer';
      } else {
        // Delay hiding popup to allow mouse movement to popup
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredLocation(null);
          overlay.setPosition(undefined);
        }, 300);
        map.getTargetElement().style.cursor = '';
      }
    });

    // Handle click for pinning popups
    map.on('click', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const feature = map.forEachFeatureAtPixel(pixel, (f) => f, {
        layerFilter: (layer) => layer.get('layerId') === 'events',
      });

      if (feature) {
        const locationData = feature.get('locationData') as HistoricalLocation;
        if (locationData) {
          setHoveredLocation(locationData);
          setIsPinned(true);
          const coords = fromLonLat(locationData.coordinates);
          overlay.setPosition(coords);
        }
      } else {
        // Clicked on empty area - unpin and close popup
        if (isPinnedRef.current) {
          setIsPinned(false);
          setHoveredLocation(null);
          overlay.setPosition(undefined);
        }
      }
    });

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      map.setTarget(undefined);
    };
  }, [locations]);

  // Handle popup mouse enter/leave
  const handlePopupMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    // Don't hide popup on mouse leave if it's pinned
    if (isPinned) return;

    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredLocation(null);
      overlayRef.current?.setPosition(undefined);
    }, 300);
  }, [isPinned]);

  // Close popup handler
  const handleClosePopup = useCallback(() => {
    setHoveredLocation(null);
    setIsPinned(false);
    overlayRef.current?.setPosition(undefined);
  }, []);

  // Toggle home overlay
  const handleToggleHomeOverlay = () => {
    if (!mapRef.current) return;

    const hasHomeLayer = mapRef.current
      .getLayers()
      .getArray()
      .some((layer) => layer.get('layerId') === 'home');

    if (hasHomeLayer) {
      mapRef.current.removeLayer(homeVectorLayer);
      setShowHomeMarker(false);
    } else {
      mapRef.current.addLayer(homeVectorLayer);
      setShowHomeMarker(true);
    }
  };

  // Refresh locations
  const handleRefresh = () => {
    const loadedLocations = getLocations();
    setLocations(loadedLocations);

    // Update events layer
    if (eventsLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(eventsLayerRef.current);

      const eventFeatures = loadedLocations.map((location) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat(location.coordinates)),
          locationId: location.id,
          locationData: location,
        });
        feature.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: EVENT_PIN_SVG,
              scale: 1,
            }),
          })
        );
        return feature;
      });

      const newEventsLayer = new VectorLayer({
        source: new VectorSource({
          features: eventFeatures,
        }),
      });
      newEventsLayer.set('layerId', 'events');
      eventsLayerRef.current = newEventsLayer;
      mapRef.current.addLayer(newEventsLayer);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Floating Controls - Top Left */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <button
          onClick={handleToggleHomeOverlay}
          className="px-4 py-2 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-xl backdrop-blur-sm"
          aria-label="Toggle home marker"
        >
          {showHomeMarker ? 'Hide' : 'Show'} Home
        </button>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-neutral-800 dark:text-neutral-200 rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-xl backdrop-blur-sm"
          aria-label="Refresh map data"
        >
          Refresh
        </button>
        <Link
          href="/map/import"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-xl backdrop-blur-sm"
        >
          Import Events
        </Link>
      </div>

      {/* Stats Overlay & Fullscreen Button - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-sm text-white shadow-lg">
          {locations.length} location{locations.length !== 1 ? 's' : ''},{' '}
          {locations.reduce((sum, loc) => sum + loc.events.length, 0)} total events
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg text-white shadow-lg transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* Full-size Map Container */}
      <div
        ref={mapContainerRef}
        className="h-full w-full"
      />

      {/* Popup Container (positioned by OpenLayers Overlay) */}
      <div
        ref={popupRef}
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
      >
        <MapPopup location={hoveredLocation} onClose={handleClosePopup} />
      </div>
    </div>
  );
}

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapContent />
    </Suspense>
  );
}
