import os, json, duckdb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Tuple



DB = "warehouse.duckdb"

app = FastAPI(title="EMSV Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # abierto en local
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# FUNCIONES AUXILIARES
# -------------------------------

def _query(sql: str, params: list | tuple = ()):
    """Abre una conexión, ejecuta una consulta y devuelve fetchall()."""
    with duckdb.connect(DB) as con:
        con.execute("LOAD spatial;")
        return con.execute(sql, params).fetchall()

def _exec_many(statements: list[tuple[str, list | tuple]]):
    """Ejecuta varias sentencias dentro de una transacción."""
    with duckdb.connect(DB) as con:
        con.execute("LOAD spatial;")
        con.execute("BEGIN")
        try:
            for sql, params in statements:
                con.execute(sql, params)
            con.execute("COMMIT")
        except Exception:
            con.execute("ROLLBACK")
            raise

def _select_buffers(where_sql: str, params: list) -> List[Tuple]:
    sql = f"""
        WITH f AS (
          SELECT id, user_id, buffer_m, geom
          FROM point_buffers
          {where_sql}
        )
        SELECT id, user_id, buffer_m, ST_AsGeoJSON(geom) AS geom_json
        FROM f;
    """
    return _query(sql, params)

# -------------------------------
# ENDPOINTS
# -------------------------------

@app.get("/health")
def health():
    return {"ok": True}


@app.get("/buffers")
def get_buffers(bbox: Optional[str] = None, limit: int = 1000, offset: int = 0):
    """Devuelve los buffers en formato GeoJSON."""
    where_sql = ""
    params: list = []

    if bbox:
        minx, miny, maxx, maxy = map(float, bbox.split(","))
        where_sql = "WHERE ST_Intersects(geom, ST_MakeEnvelope(?, ?, ?, ?)) LIMIT ? OFFSET ?"
        params = [minx, miny, maxx, maxy, limit, offset]
    else:
        where_sql = "LIMIT ? OFFSET ?"
        params = [limit, offset]

    rows = _select_buffers(where_sql, params)

    features = []
    for rid, ruser, rbuf, gjson in rows:
        geom = json.loads(gjson) if isinstance(gjson, str) else gjson
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "id": rid,
                "user_id": ruser,
                "buffer_m": float(rbuf) if rbuf is not None else None
            }
        })
    return {"type": "FeatureCollection", "features": features}


class SavePointReq(BaseModel):
    lon: float
    lat: float
    buffer_m: float = 100.0
    user_id: Optional[str] = None


@app.post("/points")
def save_point(req: SavePointReq):
    """Inserta un nuevo punto en la tabla points."""
    new_id = _query("SELECT coalesce(max(id),0)+1 FROM points")[0][0]

    _exec_many([
        ("""
         INSERT INTO points ( geom, props)
         VALUES (?, ?, ST_Point(?, ?), ?, '{"source":"form"}'::JSON)
         """,
         [new_id, req.user_id, req.lon, req.lat, req.buffer_m])
    ])
    return {"ok": True, "id": new_id}





@app.get("/points/count")
def points_count(bbox: str | None = None):
    where = ""
    params = []
    if bbox:
        minx, miny, maxx, maxy = map(float, bbox.split(","))
        where = "WHERE ST_Intersects(geom, ST_MakeEnvelope(?, ?, ?, ?))"
        params += [minx, miny, maxx, maxy]
    cnt = _query(f"SELECT COUNT(*) FROM big_points {where};", params)[0][0]
    return {"count": cnt}


from fastapi import Query, HTTPException

def _geom_expr_for_big_points():
    # inspecciona columnas disponibles
    cols = [r[1] for r in _query("PRAGMA table_info('big_points')")]
    if "geom" in cols:
        return "geom", ""  # ya está
    if "geometry" in cols:
        # asume WKB en 'geometry'
        return "ST_GeomFromWKB(geometry)", "geometry"
    if "wkb_geometry" in cols:
        return "ST_GeomFromWKB(wkb_geometry)", "wkb_geometry"
    if "wkt" in cols:
        return "ST_GeomFromText(wkt)", "wkt"
    raise HTTPException(500, "No encuentro columna de geometría en 'big_points'")
from fastapi import Query, HTTPException

@app.get("/points/features")
def points_features(
    bbox: str | None = Query(None, description="minx,miny,maxx,maxy (WGS84)"),
    limit: int = 2000,
    offset: int = 0,
):
    where = ""
    params: list = []
    if bbox:
        parts = bbox.split(",")
        if len(parts) != 4:
            raise HTTPException(400, "bbox debe ser 'minx,miny,maxx,maxy'")
        minx, miny, maxx, maxy = map(float, parts)
        where = "WHERE ST_Intersects(geom, ST_MakeEnvelope(?, ?, ?, ?))"
        params += [minx, miny, maxx, maxy]

    rows = _query(f"""
        WITH f AS (
          SELECT geom, * EXCLUDE (geom)
          FROM big_points
          {where}
          LIMIT ? OFFSET ?
        )
        SELECT ST_AsGeoJSON(geom) AS gjson, to_json(f) AS props
        FROM f;
    """, params + [limit, offset])

    feats = []
    for gjson, props in rows:
        feats.append({
            "type": "Feature",
            "geometry": json.loads(gjson),
            "properties": json.loads(props) if isinstance(props, str) else (props or {})
        })
    return {"type": "FeatureCollection", "features": feats}
from fastapi import Query, HTTPException
import json

@app.get("/shadows/features")
def shadows_features(
    bbox: str | None = Query(None, description="minx,miny,maxx,maxy (WGS84)"),
    limit: int = 5000,
    offset: int = 0,
):
    where = ""
    params: list = []
    if bbox:
        parts = bbox.split(",")
        if len(parts) != 4:
            raise HTTPException(400, "bbox debe ser 'minx,miny,maxx,maxy'")
        minx, miny, maxx, maxy = map(float, parts)
        where = "WHERE ST_Intersects(geom, ST_MakeEnvelope(?, ?, ?, ?))"
        params += [minx, miny, maxx, maxy]

    rows = _query(f"""
        WITH f AS (
          SELECT geom, shadow_count
          FROM shadows
          {where}
          LIMIT ? OFFSET ?
        )
        SELECT
          ST_AsGeoJSON(geom) AS gjson,
          shadow_count
        FROM f;
    """, params + [limit, offset])

    feats = []
    for gjson, sc in rows:
        feats.append({
            "type": "Feature",
            "geometry": json.loads(gjson),
            "properties": { "shadow_count": float(sc) if sc is not None else None }
        })
    return {"type": "FeatureCollection", "features": feats}


from pydantic import BaseModel

class ZonalReq(BaseModel):
    geometry: dict  # GeoJSON Polygon/MultiPolygon

@app.post("/shadows/zonal")
def shadows_zonal(req: ZonalReq):
    """Devuelve estadísticas de shadow_count dentro de un polígono (GeoJSON)."""
    geojson = json.dumps(req.geometry)
    rows = _query("""
        WITH zone AS (
          SELECT ST_GeomFromGeoJSON(?::VARCHAR) AS g
        ),
        hits AS (
          SELECT s.shadow_count
          FROM shadows s, zone z
          WHERE ST_Intersects(s.geom, z.g)
        )
        SELECT
          COUNT(*)                         AS n_features,
          AVG(shadow_count)                AS avg_shadow,
          MIN(shadow_count)                AS min_shadow,
          MAX(shadow_count)                AS max_shadow
        FROM hits;
    """, [geojson])

    n, avg, mn, mx = rows[0]
    return {
        "count": int(n or 0),
        "avg": float(avg) if avg is not None else None,
        "min": float(mn) if mn is not None else None,
        "max": float(mx) if mx is not None else None,
    }

# EDIFICIOS
# --- en tu FastAPI (mismo archivo de la API) ---
from fastapi import Query, HTTPException
import json

@app.get("/buildings/features")
def buildings_features(
    bbox: str | None = Query(None, description="minx,miny,maxx,maxy (WGS84)"),
    limit: int = 50000,   # puedes subirlo
    offset: int = 0,
):
    where = ""
    params: list = []
    if bbox:
        parts = bbox.split(",")
        if len(parts) != 4:
            raise HTTPException(400, "bbox debe ser 'minx,miny,maxx,maxy'")
        minx, miny, maxx, maxy = map(float, parts)
        where = "WHERE ST_Intersects(geom, ST_MakeEnvelope(?, ?, ?, ?))"
        params += [minx, miny, maxx, maxy]

    rows = _query(f"""
        WITH f AS (
          SELECT geom, * EXCLUDE (geom)
          FROM buildings
          {where}
          LIMIT ? OFFSET ?
        )
        SELECT ST_AsGeoJSON(geom) AS gjson, to_json(f) AS props
        FROM f;
    """, params + [limit, offset])

    feats = []
    for gjson, props in rows:
        feats.append({
            "type": "Feature",
            "geometry": json.loads(gjson),
            "properties": json.loads(props) if isinstance(props, str) else (props or {})
        })
    return {"type": "FeatureCollection", "features": feats}



from fastapi import Query

@app.get("/buildings/by_ref")
def building_by_reference(ref: str = Query(..., description="Referencia catastral exacta")):
    """
    Devuelve un edificio por su referencia catastral (campo 'reference').
    Búsqueda insensible a mayúsculas y espacios.
    """
    # normalizamos un poco, por si hay espacios raros
    ref_norm = ref.strip()

    rows = _query("""
        WITH f AS (
          SELECT
            geom,
            * EXCLUDE (geom)
          FROM buildings
          WHERE UPPER(reference) = UPPER(?)
          LIMIT 1
        )
        SELECT
          ST_AsGeoJSON(geom) AS gjson,
          to_json(f)         AS props
        FROM f;
    """, [ref_norm])

    if not rows:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")

    gjson, props = rows[0]
    return {
        "type": "Feature",
        "geometry": json.loads(gjson),
        "properties": json.loads(props) if isinstance(props, str) else (props or {})
    }






@app.get("/address/lookup")
async def lookup_address(
    street: str,
    number: str,
    include_feature: bool = False
):
    """
    Busca la referencia catastral por calle y número.
    Si include_feature=true, también devuelve la geometría del edificio.
    """
    import unicodedata
    
    def norm(s: str) -> str:
        if s is None: return ""
        s = unicodedata.normalize("NFD", s)
        s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
        s = s.upper().strip()
        for p in ["CALLE ", "CL ", "C/ ", "AVENIDA ", "AV ", "AV.", "PASEO ", "PS ", "PLAZA ", "PZA "]:
            if s.startswith(p): s = s[len(p):]
        s = " ".join(s.split())
        return s
    
    street_norm = norm(street)
    number_norm = norm(number)
    
    con = duckdb.connect("warehouse.duckdb", read_only=True)
    
    try:
        # 🔧 IMPORTANTE: Cargar la extensión spatial
        con.execute("LOAD spatial;")
        
        # Busca la referencia en address_index
        result = con.execute("""
            SELECT reference 
            FROM address_index 
            WHERE street_norm = ? AND number_norm = ?
            LIMIT 1
        """, [street_norm, number_norm]).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
        reference = result[0]
        
        # Si no se pide la geometría, devuelve solo la referencia
        if not include_feature:
            return {"reference": reference}
        
        # Si se pide la geometría, búscala en la tabla de edificios
        feature_result = con.execute("""
            SELECT ST_AsGeoJSON(geom) as geojson, reference
            FROM buildings
            WHERE reference = ?
            LIMIT 1
        """, [reference]).fetchone()
        
        if not feature_result:
            return {"reference": reference, "feature": None}
        
        # Construye el GeoJSON feature
        import json
        geojson_str = feature_result[0]
        geojson = json.loads(geojson_str)
        
        feature = {
            "type": "Feature",
            "geometry": geojson,
            "properties": {
                "reference": feature_result[1],
            }
        }
        
        return {"reference": reference, "feature": feature}
        
    finally:
        con.close()













        