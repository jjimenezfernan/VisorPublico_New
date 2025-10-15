import duckdb, os

DB = "warehouse.duckdb"
if os.path.exists(DB):
    os.remove(DB)

con = duckdb.connect(DB)
con.execute("INSTALL spatial; LOAD spatial;")

con.execute("""
CREATE TABLE points (
  id BIGINT,
  created_at TIMESTAMP DEFAULT now(),
  user_id VARCHAR,
  geom GEOMETRY,
  buffer_m DOUBLE DEFAULT 100.0,
  props JSON
);
""")

# Insertamos dos puntos de prueba (sin SRID)
con.execute("""
INSERT INTO points (id, user_id, geom, buffer_m, props) VALUES
  (1, 'tech1', ST_Point(-3.732336,40.300712), 250.0, '{"name":"Puerta del Sol"}'::JSON),
  (2, 'tech2', ST_Point(-3.730748, 40.319223), 100.0, '{"name":"Callao"}'::JSON);
""")
 



con.execute("""
CREATE OR REPLACE VIEW point_buffers AS
SELECT
  id,
  user_id,
  created_at,
  buffer_m,
  ST_Buffer(geom, buffer_m / 111000.0)::GEOMETRY AS geom
FROM points;
""")

print("✅ BD creada: warehouse.duckdb con tabla points y vista point_buffers")
con.close()
