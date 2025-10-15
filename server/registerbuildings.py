#
#import geopandas as gpd
#
## --- CONFIG ---
#GEOJSON_PATH = r"C:\Users\khora\Downloads\asda\edficios.geojson"  # <-- tu archivo
#PARQUET_PATH = r"C:\Users\khora\Downloads\asda\edificios.parquet"  # <-- salida
#
## Leer el GeoJSON
#gdf = gpd.read_file(GEOJSON_PATH)
#
## Aseguramos que tenga CRS WGS84 (EPSG:4326)
#if gdf.crs is None:
#    gdf.set_crs(epsg=4326, inplace=True)
#elif gdf.crs.to_epsg() != 4326:
#    gdf = gdf.to_crs(epsg=4326)
#
## Guardar como GeoParquet
#gdf.to_parquet(PARQUET_PATH)
#
#print(f"✅ Archivo convertido y guardado como GeoParquet en:\n{PARQUET_PATH}")
#print("Columnas:", list(gdf.columns))
#print("Número de filas:", len(gdf))
#print("CRS:", gdf.crs)

import duckdb

DB   = "warehouse.duckdb"
PARQ = r"C:\Users\khora\Downloads\asda\edificios.parquet"

con = duckdb.connect(DB)
con.execute("LOAD spatial;")

# Elimina si ya existe
con.execute("DROP TABLE IF EXISTS buildings;")

# Intentamos crear la tabla detectando si la geometría es WKB o GEOMETRY
try:
    con.execute(f"""
        CREATE TABLE buildings AS
        SELECT
          ST_GeomFromWKB(geometry) AS geom,
          *
        EXCLUDE (geometry)
        FROM read_parquet('{PARQ}');
    """)
    print("✅ 'buildings' creada (geometry era WKB).")
except duckdb.Error:
    con.execute(f"""
        CREATE TABLE buildings AS
        SELECT
          CAST(geometry AS GEOMETRY) AS geom,
          *
        EXCLUDE (geometry)
        FROM read_parquet('{PARQ}');
    """)
    print("✅ 'buildings' creada (geometry ya era GEOMETRY).")

# (Opcional) índice espacial virtual
# con.execute("CREATE INDEX IF NOT EXISTS idx_buildings ON buildings USING RTREE (geom);")

# Mostrar info
print("Esquema de la tabla 'buildings':")
print(con.execute("PRAGMA table_info('buildings');").fetchall())
print("Número de filas:", con.execute("SELECT COUNT(*) FROM buildings;").fetchone()[0])

con.close()
