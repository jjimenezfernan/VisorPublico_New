# setup_addresses_once.py
import json, duckdb, unicodedata, os

DB = "warehouse.duckdb"
JSON = r"C:\Users\khora\Desktop\Github\Visor_Publico_EMSV\server\resources\map\emsv_calle_num_reference.json"

def norm(s: str) -> str:
    if s is None: return ""
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.upper().strip()
    for p in ["CALLE ", "CL ", "C/ ", "AVENIDA ", "AV ", "AV.", "PASEO ", "PS ", "PLAZA ", "PZA "]:
        if s.startswith(p): s = s[len(p):]
    s = " ".join(s.split())
    return s

con = duckdb.connect(DB)
con.execute("LOAD spatial;")
con.execute("""
  CREATE TABLE IF NOT EXISTS address_index(
    street_norm TEXT,
    number_norm TEXT,
    reference   TEXT
  );
""")
con.execute("DELETE FROM address_index;")

data = json.load(open(JSON, "r", encoding="utf-8"))
rows = []
for street, nums in data.items():
    sN = norm(street)
    for num, ref in (nums or {}).items():
        rows.append((sN, norm(str(num)), str(ref)))

con.executemany("INSERT INTO address_index VALUES (?, ?, ?)", rows)
con.execute("CREATE INDEX IF NOT EXISTS idx_addr ON address_index(street_norm, number_norm)")
con.close()
print(f"Insertadas {len(rows)} filas en address_index")
