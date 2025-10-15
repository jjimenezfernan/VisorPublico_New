// StaticBuildingsLayer.jsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function StaticBuildingsLayer({ apiBase = "http://127.0.0.1:8000" }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const paneName = "buildings";

    // pane dedicado (debajo de selección)
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
      const p = map.getPane(paneName);
      p.style.zIndex = 350;
      p.style.transition = "opacity 180ms ease";
    }

    (async () => {
      // 👉 sin bbox: trae todo (tu API ya lo permite con LIMIT grande)
      const res = await fetch(`${apiBase}/buildings/features?limit=200000&offset=0`);
      if (!res.ok) return;
      const fc = await res.json();
      if (cancelled) return;

      // limpia si había algo previo
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }

      const lyr = L.geoJSON(fc, {
        pane: paneName,
        renderer: L.canvas({ padding: 0.5 }),
        interactive: false,               // mejora rendimiento si no necesitas clic sobre capa base
        style: () => ({
          color: "#ff6969ff",               // borde
          weight: 0,                    // grosor del borde
          opacity: 0.0,
          fillColor: "#ff6969ff",
          fillOpacity: 0.1,
        }),
      });

      lyr.addTo(map);
      layerRef.current = lyr;
    })();

    return () => {
      cancelled = true;
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    };
  }, [map, apiBase]);

  return null;
}
