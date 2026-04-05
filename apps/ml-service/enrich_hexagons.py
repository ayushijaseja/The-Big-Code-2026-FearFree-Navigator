import psycopg2
import h3
import requests
import os
import time
from dotenv import load_dotenv

# Load Environment Variables (GOOGLE_CLOUD_API_KEY)
load_dotenv()

# Configuration
DB_CONFIG = "postgres://fearfree_admin:supersecret@localhost:5433/fearfree_db"
GOOGLE_API_KEY = os.getenv("GOOGLE_CLOUD_API_KEY")

# More stable Overpass API Endpoint
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def enrich_data():
    try:
        conn = psycopg2.connect(DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Fetch all hexagons from your grid
        cur.execute("SELECT h3_index FROM hex_environments")
        hex_list = [row[0] for row in cur.fetchall()]
        print(f"🧐 Found {len(hex_list)} hexagons. Starting SOTA Enrichment...")

        for index in hex_list:
            lat, lng = h3.cell_to_latlng(index)
            
            # --- A. GOOGLE PLACES ENRICHMENT (Safe Places) ---
            places_count = 0
            try:
                keywords = 'pharmacy|police|hospital|atm|bank|restaurant|cafe'
                p_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=300&keyword={keywords}&key={GOOGLE_API_KEY}"
                p_res = requests.get(p_url, timeout=5).json()
                if p_res.get('status') == 'OK':
                    places_count = len(p_res.get('results', []))
            except Exception as e:
                print(f"⚠️ Places API Error on {index}: {e}")

            # --- B. OVERPASS ENRICHMENT (Street Lighting) ---
            is_lit = 0
            overpass_query = f"""
            [out:json][timeout:10];
            way(around:150,{lat},{lng})["highway"];
            out tags;
            """
            try:
                o_res = requests.post(
                    OVERPASS_URL, 
                    data={'data': overpass_query}, 
                    headers={'User-Agent': 'FearFree_IIITA_Project_Vardaan'},
                    timeout=10
                )
                
                if o_res.status_code == 200:
                    o_data = o_res.json()
                    for element in o_data.get('elements', []):
                        tags = element.get('tags', {})
                        # Check if 'lit' is 'yes' OR if it's a major road (usually lit)
                        if tags.get('lit') == 'yes' or tags.get('highway') in ['primary', 'secondary', 'tertiary']:
                            is_lit = 1
                            break
                elif o_res.status_code == 429:
                    print("🐢 Overpass Rate Limit! Sleeping 5s...")
                    time.sleep(5)
            except Exception as e:
                print(f"⚠️ Overpass JSON Error on {index}: {e}")

            # --- C. INTERNAL POSTGIS ENRICHMENT (Social Density) ---
            # This pulls the real density score from your existing density_zones table
            density_score = 10.0
            try:
                cur.execute("""
                    SELECT COALESCE(AVG(density_score), 10.0) 
                    FROM density_zones 
                    WHERE ST_DWithin(
                        location::geography, 
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, 
                        500
                    )
                """, (lng, lat))
                density_score = float(cur.fetchone()[0])
            except Exception as e:
                print(f"⚠️ Density DB Error on {index}: {e}")

            # --- D. DATABASE UPDATE ---
            cur.execute("""
                UPDATE hex_environments 
                SET safe_places = %s, is_lit = %s, density = %s 
                WHERE h3_index = %s
            """, (places_count, is_lit, density_score, index))
            
            # Commit per hexagon to ensure progress is saved if script crashes
            conn.commit()
            print(f"✅ {index} | Places: {places_count} | Lit: {is_lit} | Density: {density_score:.1f}")
            
            # Sleep 1 second to avoid getting blocked by Overpass again
            time.sleep(1.0)

        cur.close()
        conn.close()
        print("\n🎯 ENRICHMENT COMPLETE. Your database is now AI-ready!")

    except Exception as e:
        print(f"🔥 Critical Failure: {e}")

if __name__ == "__main__":
    enrich_data()