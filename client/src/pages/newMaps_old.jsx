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


const API_BASE = "http://127.0.0.1:8000";


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
    const update = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const b = map.getBounds();
        onBboxChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      }, 200);
    };
    map.on("moveend", update);
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

function ShadowsLayer({ bbox, refreshKey }) {
  const map = useMap();
  const layerRef = useRef(null);
  useEffect(() => {
    if (!bbox) return;
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ bbox: bbox.join(","), limit: "100000", offset: "0" });
      const res = await fetch(`${API_BASE}/shadows/features?${params}`);
      if (!res.ok) return;
      const fc = await res.json();
      if (cancelled) return;
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
      const lyr = L.geoJSON(fc, {
        renderer: L.canvas({ padding: 0.5 }),
        style: (f) => {
          const v = f.properties?.shadow_count;
          const c = colorForShadowCount(v);
          return { color: c, weight: 0.5, fillColor: c, fillOpacity: 0.9 };
        },
        pointToLayer: (f, latlng) => {
          const v = f.properties?.shadow_count;
          const c = colorForShadowCount(v);
          return L.circleMarker(latlng, { radius: 2.5, weight: 0, color: c, fillColor: c, fillOpacity: 0.9 });
        }
      }).addTo(map);
      layerRef.current = lyr;
    })();
    return () => { cancelled = true; if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [map, bbox, refreshKey]);
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


function BuildingsLayer({ bbox }) {
  const map = useMap();
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const abortRef = useRef(null);
  const paneName = "buildings";

  useEffect(() => {
    if (!map) return;
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
      const p = map.getPane(paneName);
      p.style.zIndex = 350;
      p.style.transition = "opacity 180ms ease";
    }
  }, [map]);

  useEffect(() => {
    if (!map || !bbox) return;

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const padded = padBBox(bbox, 0.2);
    const limit = limitForZoom(map.getZoom());

    const params = new URLSearchParams({
      bbox: padded.join(","),
      limit: String(limit),
      offset: "0",
    });

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/buildings/features?${params}`, {
          signal: ac.signal,
        });
        if (!res.ok) return;
        const fc = await res.json();
        if (ac.signal.aborted) return;

        const lyr = L.geoJSON(fc, {
          pane: paneName,
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, {
              radius: 2,
              color: "#94a3b8",
              weight: 0,
              fillColor: "#64748b",
              fillOpacity: 0.6,
            }),
          style: () => ({
            color: "#9ca3af",
            weight: 0.5,
            fillColor: "#cbd5e1",
            fillOpacity: 0.35,
          }),
        });

        const paneEl = map.getPane(paneName);
        if (paneEl) paneEl.style.opacity = "0";

        lyr.addTo(map);
        nextRef.current = lyr;

        requestAnimationFrame(() => {
          if (paneEl) paneEl.style.opacity = "1";
        });

        setTimeout(() => {
          if (currentRef.current) {
            map.removeLayer(currentRef.current);
          }
          currentRef.current = nextRef.current;
          nextRef.current = null;
        }, 200);

      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Buildings fetch error:", e);
        }
      }
    })();

    return () => {
      if (nextRef.current) {
        map.removeLayer(nextRef.current);
        nextRef.current = null;
      }
    };
  }, [map, bbox]);

  useEffect(() => {
    return () => {
      if (!map) return;
      if (abortRef.current) abortRef.current.abort();
      if (nextRef.current) {
        map.removeLayer(nextRef.current);
        nextRef.current = null;
      }
      if (currentRef.current) {
        map.removeLayer(currentRef.current);
        currentRef.current = null;
      }
    };
  }, [map]);

  return null;
}

function BindMapRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    console.log("Leaflet map listo:", map);
  }, [map, mapRef]);
  return null;
}


export default function NewMap() {
  const selectionRef = useRef(null);
  const mapRef = useRef(null); 

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const mapProps = useMemo(() => ({ center: [40.305637, -3.730671], zoom: 15 }), []);
  const [bbox, setBbox] = useState(null);
  const [refreshKey] = useState(0);

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
        const res = await fetch(`${API_BASE}/api/visor_emsv`);
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

  // 👇 AHORA los useMemo están DESPUÉS de que jsonRef esté declarado
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
      style: { color: "#ff3b30", weight: 3, fillColor: "#ff9f0a", fillOpacity: 0.25 },
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
              <BindMapRef mapRef={mapRef} />
              <BboxWatcher onBboxChange={setBbox} />
 
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                subdomains={["a", "b", "c", "d"]}
                maxZoom={19}
                opacity={0.8}
                zIndex={0}
              />

              <BuildingsLayer bbox={bbox} />
              <ShadowsLayer bbox={bbox} refreshKey={refreshKey} />
              <ZonalDrawControl onStats={(s) => console.log("Zonal stats:", s)} />
              {geoLimites && (
                <LayerGeoJSON fc={geoLimites} style={{ color: "#2563eb", weight: 1, fillOpacity: 0 }} />
              )}
            </MapContainer>
          </Box>
            
          {/* PANEL: Buscador de Direcciones */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          bgcolor="#f3f4f6"
          display="flex"
          alignItems="stretch"
          justifyContent="space-evenly"
          py="10px"
          px="1rem"
          flexDirection="column"
          borderRadius="10px"
        >
          <Typography
            variant="h6"
            color="#fff"
            fontWeight={600}
            px="0.3rem"
            sx={{ background: colors.blueAccent[400], borderRadius: "5px", mb: 1 }}
          >
            Buscador de Direcciones
          </Typography>

          {/* Etiquetas */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Calle/Avenida/Plaza
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Número del Portal
            </Typography>
          </Box>

          {/* Autocompletes y botón BUSCAR */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 1, mb: 1 }}>
            {/* Autocomplete de Calles */}
            <Autocomplete
              size="small"
              value={street}
              onChange={(event, newValue) => {
                setStreet(newValue || "");
                setPortal(""); // Resetea el número cuando cambia la calle
              }}
              inputValue={street}
              onInputChange={(event, newInputValue) => {
                setStreet(newInputValue);
              }}
              options={availableStreets}
              loading={loadingEmsv}
              noOptionsText="No hay calles disponibles"
              sx={{ bgcolor: "white" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Escribe o selecciona..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingEmsv ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {/* Autocomplete de Números */}
            <Autocomplete
              size="small"
              value={portal}
              onChange={(event, newValue) => {
                setPortal(newValue || "");
              }}
              inputValue={portal}
              onInputChange={(event, newInputValue) => {
                setPortal(newInputValue);
              }}
              options={availableNumbers}
              disabled={!street}
              noOptionsText="Selecciona primero una calle"
              sx={{ bgcolor: "white" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Escribe o selecciona..."
                />
              )}
            />

            {/* Botón BUSCAR */}
            <Button
              variant="contained"
              disableElevation
              sx={{ 
                bgcolor: colors.blueAccent[500],
                color: "white",
                px: 3,
                '&:hover': { bgcolor: colors.blueAccent[600] }
              }}
              onClick={handleSearch}
              disabled={searching || !street || !portal}
            >
              {searching ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "BUSCAR"}
            </Button>
          </Box>

          {/* Botones RESTABLECER DATOS y DESCARGAR PDF */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              disableElevation
              sx={{ 
                bgcolor: "#9e9e9e",
                color: "white",
                '&:hover': { bgcolor: "#757575" }
              }}
              onClick={handleReset}
            >
              RESTABLECER DATOS
            </Button>
            <Button
              variant="contained"
              size="small"
              fullWidth
              disableElevation
              sx={{ 
                bgcolor: "#9e9e9e",
                color: "white",
                '&:hover': { bgcolor: "#757575" }
              }}
              onClick={() => console.log("Descargar PDF - Por implementar")}
            >
              DESCARGAR PDF
            </Button>
          </Box>

          {searchError && (
            <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
              {searchError}
            </Alert>
          )}
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

          {/* PANEL: Additional Panel 2 */}
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
              Panel Adicional 2
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contenido del panel...
            </Typography>
          </Box>

          {/* PANEL: Additional Panel 3 */}
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
              Panel Adicional 3
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