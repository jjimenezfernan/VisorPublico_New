# ingest_buildings.py
import duckdb, os, sys

DB = "warehouse.duckdb"
GEOJSON = sys.argv[1] if len(sys.argv) > 1 else "buildings.geojson"  # path to your file

con = duckdb.connect(DB)
con.execute("INSTALL spatial; LOAD spatial;")

# Make sure the DB exists (do NOT remove it)
con.execute("""
CREATE TABLE IF NOT EXISTS buildings AS
SELECT * FROM ST_Read(?);
""", [GEOJSON])

# If you re-run and want to replace:
# con.execute("DELETE FROM buildings;")
# con.execute("INSERT INTO buildings SELECT * FROM ST_Read(?);", [GEOJSON])

# Ensure geometry is WGS84 (EPSG:4326) for web maps
# If your file isn’t in 4326, set the correct source SRID and transform:
# con.execute("ALTER TABLE buildings ALTER COLUMN geom SET DATA TYPE GEOMETRY(SRID=XXXX);")
# con.execute("UPDATE buildings SET geom = ST_Transform(geom, 4326) WHERE ST_SRID(geom) != 4326;")

# Optional: keep only columns you need (smaller payloads)
# con.execute("CREATE OR REPLACE TABLE buildings AS SELECT geom, refcat, uso, ano_constru FROM buildings");

print("✅ Buildings loaded into 'buildings' table")
con.close()
