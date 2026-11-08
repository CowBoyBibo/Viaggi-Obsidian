import os
import json
import re
import requests

PROFILE_URL = os.environ.get(
    "MAPS_PROFILE_URL",
    "https://www.google.com/maps/contrib/10141104304312624100/contribs/"
)

def fetch_local_guide_stats():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7"
    }
    
    # Dati di fallback
    stats = {
        "level": 5,
        "views": "110k+",
        "reviews": "23",
        "photos": "62",
        "points": "852"
    }

    try:
        response = requests.get(PROFILE_URL, headers=headers, timeout=10)
        if response.status_code == 200:
            html = response.text
            
            level_match = re.search(r'Livello\s*(\d+)|Level\s*(\d+)', html, re.IGNORECASE)
            if level_match:
                stats["level"] = int(level_match.group(1) or level_match.group(2))
                
            views_match = re.search(r'([\d\.\,\+kM]+)\s*visualizzazioni|views', html, re.IGNORECASE)
            if views_match:
                stats["views"] = views_match.group(1).strip()
    except Exception as e:
        print(f"Nota: Recupero live fallito, uso i dati predefiniti. ({e})")

    # Salva i dati nella cartella content/data/ per Quartz
    output_dir = os.path.join("content", "data")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "maps_stats.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
        
    print(f"Statistiche salvate in: {output_path}")

if __name__ == "__main__":
    fetch_local_guide_stats()
