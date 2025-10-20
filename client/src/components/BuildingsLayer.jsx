// StaticBuildingsLayer.jsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// at top of component file (helpers)
const baseStyle = (clickable) => ({
  color: "#ff6969ff",
  weight: 0.5,
  opacity: 0.25,
  fillColor: "#ff6969ff",
  fillOpacity: clickable ? 0.12 : 0.08,
});

const hoverStyle = {
  color: "#ff564dff",      // border on hover
  weight: 1,           // thin outline so it “pops”
  opacity: 0.25,
  fillColor: "#ff9f0a",
  fillOpacity: 0.28,
};



export default function StaticBuildingsLayer({
  apiBase = "http://127.0.0.1:8000",
  onLoadComplete,
  onBuildingClick,
  clickable = false,
}) {
  const map = useMap();
  const layerRef = useRef(null);
  const dataRef = useRef(null);
  const rendererRef = useRef(null);
  const paneName = "buildings";

  // Create pane + renderer once
  useEffect(() => {
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
      const p = map.getPane(paneName);
      p.style.zIndex = 440;
      p.style.transition = "opacity 180ms ease";
    }
    if (!rendererRef.current) {
      rendererRef.current = L.canvas({ padding: 0.5, pane: paneName });
    }
  }, [map]);

  // Fetch once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`${apiBase}/buildings/features?limit=200000&offset=0`);
      if (!res.ok) return;
      const fc = await res.json();
      if (cancelled) return;
      dataRef.current = fc;
      rebuildLayer();
      onLoadComplete?.();
    })();
    return () => { cancelled = true; removeLayer(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, map]);

  // React to clickable toggle
  useEffect(() => {
    const p = map.getPane(paneName);
    if (p) p.style.pointerEvents = clickable ? "auto" : "none"; // now this works (separate canvas)
    if (dataRef.current) rebuildLayer(); // rebuild to attach/detach handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickable]);

  function removeLayer() {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  }

  function rebuildLayer() {
    removeLayer();
    if (!dataRef.current) return;



    const lyr = L.geoJSON(dataRef.current, {
      pane: paneName,
      renderer: rendererRef.current,
      interactive: clickable,
      style: () => baseStyle(clickable),
      onEachFeature: (feature, layer) => {
        if (!clickable) return;

        // click
        if (onBuildingClick) layer.on("click", () => onBuildingClick(feature));

        // hover – visual + cursor + bring to front
        layer.on("mouseover", () => {
          layer.setStyle(hoverStyle);
          layer.bringToFront?.();                 // works on Canvas too
          map.getContainer().style.cursor = "pointer";
        });

        layer.on("mouseout", () => {
          layer.setStyle(baseStyle(true));        // restore base
          map.getContainer().style.cursor = "";
        });
      },
    });


    lyr.addTo(map);
    layerRef.current = lyr;
  }

  return null;
}
