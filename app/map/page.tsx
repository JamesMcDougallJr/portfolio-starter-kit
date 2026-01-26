'use client';

import { Feature, Map as OlMap, View, Overlay } from 'ol';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import { useEffect, useRef, useState, useCallback } from 'react';
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

export default function Page(): JSX.Element {
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

  // Keep ref in sync with state to avoid stale closures in event handlers
  useEffect(() => {
    hoveredLocationIdRef.current = hoveredLocation?.id ?? null;
  }, [hoveredLocation]);

  // Load locations from localStorage
  useEffect(() => {
    const loadedLocations = getLocations();
    setLocations(loadedLocations);
  }, []);

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
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredLocation(null);
      overlayRef.current?.setPosition(undefined);
    }, 300);
  }, []);

  // Close popup handler
  const handleClosePopup = useCallback(() => {
    setHoveredLocation(null);
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
    <>
      <section>
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Historical Map
        </h1>
      </section>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleToggleHomeOverlay}
            className="px-4 py-2 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg"
            aria-label="Toggle home marker"
          >
            {showHomeMarker ? 'Hide' : 'Show'} Home
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-lg transition-colors text-sm font-medium"
            aria-label="Refresh map data"
          >
            Refresh
          </button>
          <Link
            href="/map/import"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg"
          >
            Import Events
          </Link>
        </div>

        {/* Stats */}
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {locations.length} location{locations.length !== 1 ? 's' : ''},{' '}
          {locations.reduce((sum, loc) => sum + loc.events.length, 0)} total events
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="h-96 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md"
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
    </>
  );
}
