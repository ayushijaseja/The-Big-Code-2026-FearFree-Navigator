import psycopg2
import h3
from psycopg2 import extras

DB_CONFIG = "postgres://fearfree_admin:supersecret@localhost:5433/fearfree_db"

def setup_database():
    try:
        conn = psycopg2.connect(DB_CONFIG)
        cur = conn.cursor()
        print("🔌 Connected to PostGIS on port 5433.")

        print("🏗️  Creating hex_environments table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS hex_environments (
                h3_index TEXT PRIMARY KEY,
                safe_places INTEGER DEFAULT 0,
                is_lit INTEGER DEFAULT 0,
                density FLOAT DEFAULT 0.0,
                geom GEOMETRY(Polygon, 4326)
            );
            CREATE INDEX IF NOT EXISTS idx_hex_geom ON hex_environments USING GIST (geom);
        """)

        print("📍 Generating H3 Grid for Prayagraj (H3 v4 Syntax)...")
        center_lat, center_lng = 25.4358, 81.8463
        resolution = 8  

        origin_cell = h3.latlng_to_cell(center_lat, center_lng, resolution)
        hexagons = h3.grid_disk(origin_cell, 10)
        
        data_to_insert = []
        for h_index in hexagons:
            boundary = h3.cell_to_boundary(h_index)
            
            wkt_coords = ", ".join([f"{lon} {lat}" for lat, lon in boundary])
            wkt_coords += f", {boundary[0][1]} {boundary[0][0]}"
            wkt_poly = f"POLYGON(({wkt_coords}))"
            
            data_to_insert.append((
                h_index, 
                5,    
                1,  
                75.5,
                wkt_poly
            ))

        print(f"📦 Inserting {len(data_to_insert)} hexagons...")
        insert_query = """
            INSERT INTO hex_environments (h3_index, safe_places, is_lit, density, geom)
            VALUES (%s, %s, %s, %s, ST_GeomFromText(%s, 4326))
            ON CONFLICT (h3_index) DO NOTHING;
        """
        extras.execute_batch(cur, insert_query, data_to_insert)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database setup and grid population complete!")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    setup_database()