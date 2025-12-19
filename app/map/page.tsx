'use client';

import { Feature, Map as OlMap, View } from "ol";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import { useEffect, useRef } from "react";
import { fromLonLat } from "ol/proj";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

export default function Page(): JSX.Element {
  const mapRef = useRef<OlMap>()
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Create the marker feature
  const marker = new Feature({
    geometry: new Point(fromLonLat([-111.8864, 40.7444])),
  });

  // Define the marker style (simple pin icon)
  marker.setStyle(
    new Style({
      image: new Icon({
        anchor: [0.5, 1], // center bottom of the icon
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.07, // adjust size
      }),
    })
  );

  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: [marker],
    }),
  });

  vectorLayer.set('layerId', 'home');

  useEffect(() => {
    const createMap = () => {
      if (!mapContainerRef.current) return;

      mapRef.current = new OlMap({
        layers: [
          new TileLayer({
            source: new XYZ({
              url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
            })
          }),
        ],
        view: new View({
          center: fromLonLat([-111.8881, 40.7606]), // Denver, CO
          zoom: 8,
        }),
        target: mapContainerRef.current,
      });
    }

    createMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget();
      }
    };
  }, [mapContainerRef]);

  const handleToggleOverlay = () => {
    const hasHomeLayer = mapRef.current && mapRef
      .current
      .getLayers()
      .getArray()
      .some(layer => layer.get("layerId") === "home");
    if (!mapRef.current) return;

    if (hasHomeLayer) {
      mapRef.current.removeLayer(vectorLayer)
    } else {
      mapRef.current.addLayer(vectorLayer);
    }
  };

  return (
    <>
      <section>
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Map
        </h1>
      </section>
      <div className="space-y-4">
        <button
          onClick={handleToggleOverlay}
          className="px-6 py-3 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
          aria-label="Toggle map overlay"
        >
          Toggle Overlay
        </button>
        <div
          ref={mapContainerRef}
          className="h-96 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md"
        />
      </div>
    </>
  )
}
