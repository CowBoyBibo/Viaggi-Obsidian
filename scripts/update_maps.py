"""Aggiorna content/data/maps_stats.json con le statistiche Local Guide.

Nessuno scraping: i valori si passano da riga di comando (o dal workflow
GitHub Actions). I campi non indicati restano quelli già salvati.

Esempio:
    python update_maps.py --level 6 --points 1700 --views 160k+
"""
import argparse
import json
import os
from datetime import date

OUTPUT_PATH = os.path.join("content", "data", "maps_stats.json")
FIELDS = ["level", "points", "reviews", "photos", "views"]


def load_existing():
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for field in FIELDS:
        parser.add_argument(f"--{field}", default="")
    args = parser.parse_args()

    stats = load_existing()

    for field in FIELDS:
        value = getattr(args, field).strip()
        if not value:
            continue
        # il livello resta un numero, gli altri campi stringhe (come prima)
        stats[field] = int(value) if field == "level" else value

    stats["updated"] = date.today().isoformat()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Statistiche salvate in {OUTPUT_PATH}: {stats}")


if __name__ == "__main__":
    main()
