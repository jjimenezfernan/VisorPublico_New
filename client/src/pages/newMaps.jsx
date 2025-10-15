// newMap.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SubUpBar from "../global_components/SubUpBar";
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress, 
  useTheme, 
  Select, 
  Autocomplete    
} from "@mui/material";

import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";

import { tokens } from "../data/theme";
// newMap.jsx
// ...
import SearchBoxEMSV from "../components/SearchBoxEMSV"; // ← ruta paralela a MapEMSV/MapZoomProvider
// ...
import StaticBuildingsLayer from "../components/BuildingsLayer";



const API_BASE = "http://127.0.0.1:8000";
import { DIRECTION } from "../data/direccion_server";
const EMSV_URL = `${DIRECTION}/api/visor_emsv`;


// ---- leyenda ----
const BINS = [
  { min: 2,  max: 4,  color: "#d1d5db" },
  { min: 4,  max: 6,  color: "#9ca3af" },
  { min: 6,  max: 8,  color: "#6b7280" },
  { min: 8,  max: 10, color: "#4b5563" },
  { min: 10, max: 17, color: "#111827" },
];
const colorForShadowCount = (v) => {
  if (v == null) return "#cccccc";
  for (const b of BINS) if (v >= b.min && v < b.max) return b.color;
  if (v >= BINS[BINS.length - 1].min) return BINS[BINS.length - 1].color;
  return "#cccccc";
};




// ---------- helpers (normalización y lookup) ----------
const stripAccents = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const norm = (s) =>
  stripAccents(String(s ?? ""))
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();




function BboxWatcher({ onBboxChange }) {
  const map = useMap();
  useEffect(() => {
    let t;
    const DEBOUNCE = 280;
    const update = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const b = map.getBounds();
        onBboxChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      }, DEBOUNCE);
    };
    map.on("moveend", update); // evita "move" para no refetchear durante el arrastre
    update();
    return () => { clearTimeout(t); map.off("moveend", update); };
  }, [map, onBboxChange]);
  return null;
}






function Legend() {
  return (
    <div style={{
      position: "absolute", right: 12, bottom: 12, zIndex: 1000,
      background: "white", padding: "8px 10px", borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)", font: "12px system-ui"
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Horas de sombra</div>
      {BINS.map((b, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", margin: "2px 0" }}>
          <span style={{
            display: "inline-block", width: 12, height: 12, borderRadius: 9999,
            background: b.color, marginRight: 8, border: "1px solid #999"
          }} />
          <span>{b.min} – {b.max} h</span>
        </div>
      ))}
    </div>
  );
}



function ShadowsLayer({ bbox, minZoom = 16, maxZoom = 19 }) {
  const map = useMap();
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const abortRef = useRef(null);
  const prevFetchBBoxRef = useRef(null);
  const paneName = "shadows-pane";
  const rendererRef = useRef(null);

  // tuning del progresivo
  const CHUNK_SIZE = 2000;   // nº de features por “oleada”
  const CHUNK_DELAY = 16;    // ms entre oleadas (≈ 1 frame). Sube a 30–50 si va muy denso.
  const PANE_FADE_MS = 220;  // crossfade del pane

  useEffect(() => {
    if (!map) return;
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
      const p = map.getPane(paneName);
      p.style.zIndex = 420;
      p.style.transition = `opacity ${PANE_FADE_MS}ms ease`;
      p.style.mixBlendMode = "multiply";
      p.style.opacity = "1";
    }
    if (!rendererRef.current) {
      rendererRef.current = L.canvas({ padding: 0.5 });
    }
  }, [map]);

  const inRange = () => {
    const z = map?.getZoom?.() ?? 0;
    return z >= minZoom && z <= maxZoom;
  };
  const pointRadiusForZoom = (z) => Math.max(1.6, Math.min(0.8 + (z - 15) * 1.1, 5));

  const padBBox = ([w, s, e, n], r = 0.12) => {
    const dx = (e - w) * r, dy = (n - s) * r;
    return [w - dx, s - dy, e + dx, n + dy];
  };
  const shouldRefetch = (newB, oldB) => {
    if (!oldB) return true;
    const [w1, s1, e1, n1] = newB; const [w0, s0, e0, n0] = oldB;
    const width = Math.max(1e-9, e0 - w0), height = Math.max(1e-9, n0 - s0);
    return (
      Math.abs(w1 - w0) > width * 0.12 ||
      Math.abs(e1 - e0) > width * 0.12 ||
      Math.abs(s1 - s0) > height * 0.12 ||
      Math.abs(n1 - n0) > height * 0.12
    );
  };

  // render progresivo de un FeatureCollection a una L.geoJSON vacía
  const progressivelyAdd = async (fc, lyr, signal) => {
    const feats = fc.features || [];
    let i = 0;

    const step = () => {
      if (signal.aborted) return;
      const next = feats.slice(i, i + CHUNK_SIZE);
      if (next.length) {
        lyr.addData({ type: "FeatureCollection", features: next });
        i += next.length;
        setTimeout(step, CHUNK_DELAY);
      }
    };
    step();
  };

  useEffect(() => {
    if (!map || !bbox || !inRange()) {
      if (currentRef.current) { map.removeLayer(currentRef.current); currentRef.current = null; }
      return;
    }

    const padded = padBBox(bbox, 0.1);
    if (!shouldRefetch(padded, prevFetchBBoxRef.current)) {
      const r = pointRadiusForZoom(map.getZoom());
      if (currentRef.current) currentRef.current.eachLayer((m) => { if (m.setRadius) m.setRadius(r); });
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const params = new URLSearchParams({ bbox: padded.join(","), limit: "100000", offset: "0" });
    const paneEl = map.getPane(paneName);
    const radius = pointRadiusForZoom(map.getZoom());

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/shadows/features?${params}`, { signal: ac.signal });
        if (!res.ok) return;
        const fc = await res.json();
        if (ac.signal.aborted) return;

        // capa "siguiente" vacía, añadimos en chunks
        const lyr = L.geoJSON(null, {
          pane: paneName,
          renderer: rendererRef.current,
          interactive: false,
          style: (f) => {
            const v = f.properties?.shadow_count;
            const c = colorForShadowCount(v);
            return { color: c, weight: 0, fillColor: c, fillOpacity: 0.9 };
          },
          pointToLayer: (f, latlng) => {
            const v = f.properties?.shadow_count;
            const c = colorForShadowCount(v);
            return L.circleMarker(latlng, {
              radius,
              stroke: false,
              fillColor: c,
              fillOpacity: 0.9,
              renderer: rendererRef.current,
              pane: paneName,
            });
          },
        });

        // Añade la capa y empieza la “aparición” progresiva
        lyr.addTo(map);
        nextRef.current = lyr;

        // pane a 0 -> llenamos -> swap -> a 1 (crossfade)
        if (paneEl) paneEl.style.opacity = "0";
        await progressivelyAdd(fc, lyr, ac.signal);
        if (ac.signal.aborted) return;

        // swap sin quitar pane (ya está en 0; no hay flash)
        if (currentRef.current) map.removeLayer(currentRef.current);
        currentRef.current = nextRef.current;
        nextRef.current = null;

        // sube opacidad (aparecen “poco a poco” y, además, con fade final)
        if (paneEl) paneEl.style.opacity = "1";

        prevFetchBBoxRef.current = padded;
      } catch (e) {
        if (e.name !== "AbortError") console.error("Shadows fetch error:", e);
      }
    })();

    return () => {
      if (nextRef.current) { map.removeLayer(nextRef.current); nextRef.current = null; }
    };
  }, [map, bbox, minZoom, maxZoom]);

  // al cambiar zoom: no refetch, solo ajusta radio
  useEffect(() => {
    if (!map) return;
    const onZoomEnd = () => {
      if (!inRange()) {
        if (currentRef.current) { map.removeLayer(currentRef.current); currentRef.current = null; }
        return;
      }
      const r = pointRadiusForZoom(map.getZoom());
      if (currentRef.current) currentRef.current.eachLayer((m) => { if (m.setRadius) m.setRadius(r); });
    };
    map.on("zoomend", onZoomEnd);
    return () => map.off("zoomend", onZoomEnd);
  }, [map, minZoom, maxZoom]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (nextRef.current && map) map.removeLayer(nextRef.current);
      if (currentRef.current && map) map.removeLayer(currentRef.current);
      nextRef.current = null;
      currentRef.current = null;
    };
  }, [map]);

  return null;
}


function ZonalDrawControl({ onStats }) {
  const map = useMap();
  const controlRef = useRef(null);
  useEffect(() => {
    const drawn = new L.FeatureGroup();
    map.addLayer(drawn);
    controlRef.current = new L.Control.Draw({
      edit: { featureGroup: drawn },
      draw: {
        marker: false, polyline: false, polygon: true,
        rectangle: true, circle: true, circlemarker: false
      }
    });
    map.addControl(controlRef.current);
    const onCreated = async (e) => {
      const layer = e.layer; drawn.addLayer(layer);
      let gj;
      if (layer instanceof L.Circle) {
        const c = layer.getLatLng(); const r = layer.getRadius();
        gj = turf.circle([c.lng, c.lat], r, { units: "meters", steps: 64 });
      } else {
        gj = layer.toGeoJSON();
      }
      const geometry = gj.type === "Feature" ? gj.geometry : gj;
      const res = await fetch(`${API_BASE}/shadows/zonal`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geometry })
      });
      const stats = await res.json();
      if (onStats) onStats(stats);
      const ll = layer.getBounds ? layer.getBounds().getCenter() : map.getCenter();
      L.popup()
        .setLatLng(ll)
        .setContent(`
          <b>Estadísticas del área</b><br/>
          Elementos: ${stats.count}<br/>
          Media: ${stats.avg?.toFixed(2) ?? "–"} h<br/>
          Mín: ${stats.min?.toFixed(2) ?? "–"} h · Máx: ${stats.max?.toFixed(2) ?? "–"} h
        `)
        .openOn(map);
    };
    map.on(L.Draw.Event.CREATED, onCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      if (controlRef.current) map.removeControl(controlRef.current);
      map.removeLayer(drawn);
    };
  }, [map, onStats]);
  return null;
}

function padBBox([minx, miny, maxx, maxy], padRatio = 0.2) {
  const dx = maxx - minx;
  const dy = maxy - miny;
  const px = dx * padRatio;
  const py = dy * padRatio;
  return [minx - px, miny - py, maxx + px, maxy + py];
}

function limitForZoom(z) {
  if (z <= 12) return 8000;
  if (z <= 14) return 20000;
  if (z <= 16) return 50000;
  return 100000;
}


function BindMapRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    console.log("Leaflet map listo:", map);
  }, [map, mapRef]);
  return null;
}

function SetupLimitPanes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("limits-casing")) {
      map.createPane("limits-casing");
      map.getPane("limits-casing").style.zIndex = 460; // debajo del dash
    }
    if (!map.getPane("limits-dash")) {
      map.createPane("limits-dash");
      map.getPane("limits-dash").style.zIndex = 461; // encima
    }
  }, [map]);
  return null;
}




export default function NewMap() {
  const selectionRef = useRef(null);
  const mapRef = useRef(null); 

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const mapProps = useMemo(() => ({ center: [40.305637, -3.730671], zoom: 15 }), []);
  const [bbox, setBbox] = useState(null);
  

  // -------- EMSV datasets --------
  const [loadingEmsv, setLoadingEmsv] = useState(true);
  const [errorEmsv, setErrorEmsv] = useState("");
  const [geoLimites, setGeoLimites] = useState(null);
  const [geoConViv, setGeoConViv] = useState(null);
  const [geoSinViv, setGeoSinViv] = useState(null);
  const [jsonRef, setJsonRef] = useState(null); // 👈 Ahora está declarado ANTES de los useMemo

  // ---------- finder UI state ----------
  const [street, setStreet] = useState("");
  const [portal, setPortal] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // fetch EMSV on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingEmsv(true);
        setErrorEmsv("");
        
        
        const res = await fetch(EMSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        setGeoLimites(data.geo_limites_getafe_emsv ?? null);
        setGeoConViv(data.geo_emsv_parcela_con_vivienda ?? null);
        setGeoSinViv(data.geo_emsv_parcela_sin_vivienda ?? null);
        setJsonRef(data.json_emsv_calle_num_reference ?? null);
      } catch (e) {
        setErrorEmsv("No se pudo cargar el índice de direcciones.");
      } finally {
        if (!cancelled) setLoadingEmsv(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  
  const availableStreets = useMemo(() => {
    if (!jsonRef) return [];
    
    const streets = new Set();
    
    if (typeof jsonRef === 'object' && !Array.isArray(jsonRef)) {
      Object.keys(jsonRef).forEach(calle => streets.add(calle));
    }
    
    return Array.from(streets).sort((a, b) => 
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, [jsonRef]);

  const availableNumbers = useMemo(() => {
    if (!jsonRef || !street) return [];
    
    const numbers = new Set();
    
    if (typeof jsonRef === 'object' && !Array.isArray(jsonRef)) {
      const calleData = jsonRef[street];
      if (calleData && typeof calleData === 'object') {
        Object.keys(calleData).forEach(num => numbers.add(num));
      }
    }
    
    return Array.from(numbers).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    });
  }, [jsonRef, street]);

  function clearSelection(map) {
    if (map && selectionRef.current) {
      map.removeLayer(selectionRef.current);
      selectionRef.current = null;
    }
  }

  function highlightSelectedFeature(map, feature, popupHtml) {
    if (!map || !feature) return;

    if (!map.getPane("selection")) {
      map.createPane("selection");
      map.getPane("selection").style.zIndex = 450;
    }
    if (selectionRef.current) {
      map.removeLayer(selectionRef.current);
      selectionRef.current = null;
    }

    const lyr = L.geoJSON(feature, {
      pane: "selection",
      style: { color: "#ff564dff", weight: 1, fillColor: "#ff9f0a", fillOpacity: 0.25 },
      pointToLayer: (_f, latlng) =>
        L.circleMarker(latlng, { radius: 8, color: "#ff3b30", weight: 3, fillColor: "#ff9f0a", fillOpacity: 0.6 })
    }).addTo(map);
    selectionRef.current = lyr;

    const g = feature.geometry;
    if (g?.type === "Point" && Array.isArray(g.coordinates)) {
      const [x, y] = g.coordinates;
      map.setView([y, x], 19);
    } else {
      const b = lyr.getBounds?.();
      if (b && b.isValid()) map.fitBounds(b.pad(0.4));
    }

    if (popupHtml) {
      const center =
        (g?.type === "Point" && Array.isArray(g.coordinates))
          ? L.latLng(g.coordinates[1], g.coordinates[0])
          : (lyr.getBounds?.().getCenter?.());
      if (center) L.popup().setLatLng(center).setContent(popupHtml).openOn(map);
    }
  }




  // dentro de NewMap()
  const clearSelectionAndPopup = () => {
    const map = mapRef.current;
    if (!map) return;
    if (selectionRef.current) {
      map.removeLayer(selectionRef.current);
      selectionRef.current = null;
    }
    map.closePopup();
  };



  const handleSearch = async () => {
    setSearchError("");
    const calle = street.trim();
    const numero = portal.trim();
    
    if (!calle || !numero) {
      setSearchError("Introduce calle y número.");
      return;
    }

    setSearching(true);
    try {
      const qs = new URLSearchParams({
        street: calle,
        number: numero,
        include_feature: "true",
      });
      
      const res = await fetch(`${API_BASE}/address/lookup?${qs}`);
      
      if (!res.ok) {
        setSearchError(res.status === 404 ? "Dirección no encontrada." : `Error ${res.status}`);
        return;
      }
      
      const data = await res.json();
      
      if (!data.feature) {
        setSearchError("Referencia encontrada pero sin geometría.");
        return;
      }

      const feature = data.feature;
      const p = feature.properties || {};
      
      const html = `
        <div style="font: 13px system-ui">
          <div style="font-weight:700;margin-bottom:4px;">${calle.toUpperCase()} ${numero}</div>
          <div><b>Referencia:</b> ${p.reference ?? data.reference}</div>
        </div>
      `;
      
      highlightSelectedFeature(mapRef.current, feature, html);
      
    } catch (e) {
      console.error(e);
      setSearchError("No se pudo buscar la dirección.");
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setStreet("");
    setPortal("");
    setSearchError("");
    clearSelection(mapRef.current);
    clearSelectionAndPopup();
  };

  const bounds = [
    [40.279393, -3.766208],
    [40.338090, -3.646864],
  ];
  
  return (
    <>
      <SubUpBar
        title={"Visor de Datos Públicos de Vivienda"}
        crumbs={[["Inicio", "/"], ["Visor EPIU", "/visor-epiu"]]}
        info={{ title: "Visor de Datos Públicos de Vivienda", description: (<Typography />) }}
      />
      <Box m="10px">
        <Box
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gridAutoRows="calc((100vh - 60px - 40px - 20px - 10px) / 8.8)"
          gap="10px"
        >
          {/* MAPA - 8 columns, 8 rows */}
          <Box
            gridColumn="span 8"
            gridRow="span 8"
            bgcolor="#f9fafb"
            borderRadius="10px"
            overflow="hidden"
            position="relative"
          > 
            <Legend />
            <MapContainer
              center={[40.307927, -3.732297]}
              minZoom={14}
              maxZoom={18}  
              zoom={mapProps.zoom}
              maxBounds={bounds}    
              maxBoundsViscosity={1.0} 
              preferCanvas={true}
              renderer={L.canvas({ padding: 0.5 })}
              style={{ height: "100%", width: "100%", background: "#f3f4f6" }}
            >
              <StaticBuildingsLayer apiBase={API_BASE} />
              <BindMapRef mapRef={mapRef} />
              <SetupLimitPanes />
              <BboxWatcher onBboxChange={setBbox} />
 
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                subdomains={["a", "b", "c", "d"]}
                maxZoom={19}
                opacity={0.8}
                zIndex={0}
              />
              <ShadowsLayer bbox={bbox}  minZoom={17} maxZoom={18} />
              <ZonalDrawControl onStats={(s) => console.log("Zonal stats:", s)} />
           
              {geoLimites && (
                <>
                  {/* Trazo discontinuo oscuro (encima) */}
                  <LayerGeoJSON
                    fc={geoLimites}
                    style={{
                      pane: "limits-dash",
                      color: "#c5c5c5ff",      
                      weight: 2,
                      opacity: 1,
                      dashArray: "6 6",      
                      fillOpacity: 0,
                      interactive: false,
                      lineCap: "butt",
                      lineJoin: "round",
                      smoothFactor: 1.2,
                    }}
                  />
                </>
              )}

            </MapContainer>
          </Box>
            
        {/* Buscador de direcciones */}
        <Box
        gridColumn="span 4"
        gridRow="span 2"
        sx={{
          backgroundColor: colors.gray[900],
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          pt: "100px",
          py: "5px",
          px: "1rem",
          borderRadius: "10px",
          pb: 1, 
          gap: 1,  
        }}
      >
        <Typography
          variant="h6"
          color="#fff"
          fontWeight={600}
          px="0.3rem"
          sx={{
            background: colors.blueAccent[400],
            borderRadius: "5px",          
            // si prefieres margen en vez de gap: mb: 1,
          }}
        >
          Buscador de Direcciones
        </Typography>

        <SearchBoxEMSV
          jsonRef={jsonRef}
          loading={loadingEmsv}
          apiBase={API_BASE}
          onFeature={(feature, html) => {
            highlightSelectedFeature(mapRef.current, feature, html);
          }}
          onReset={clearSelectionAndPopup} 
        />
      </Box>

        
          {/* PANEL: Additional Panel 1 */}
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            bgcolor="#f3f4f6"
            display="flex"
            alignItems="stretch"
            justifyContent="space-evenly"
            py="5px"
            px="1rem"
            flexDirection="column"
            borderRadius="10px"
          >
            <Typography
              variant="h6"
              color="#fff"
              fontWeight={600}
              px="0.3rem"
              sx={{ background: colors.blueAccent[400], borderRadius: "5px" }}
            >
              Panel Adicional 1
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contenido del panel...
            </Typography>
          </Box>
          

       

          
        </Box>
      </Box>
    </>
  );
}

function LayerGeoJSON({ fc, style }) {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    if (!fc) return;
    if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
    const lyr = L.geoJSON(fc, { style });
    lyr.addTo(map);
    ref.current = lyr;
    return () => { if (ref.current) map.removeLayer(ref.current); };
  }, [map, fc, style]);
  return null;
}