"""Aggiorna content/data/maps_stats.json con le statistiche Local Guide.

Nessuno scraping: i valori si passano da riga di comando (o dal modulo
"Run workflow" di GitHub Actions). I campi lasciati vuoti restano quelli
già salvati. Le voci non più usate (recensioni, foto) vengono eliminate.

Esempio:
    python update_maps.py --level 6 --points 1,7K --contributions 464 --views 150K
"""
import argparse
import json
import os
from datetime import date

OUTPUT_PATH = os.path.join("content", "data", "maps_stats.json")
FIELDS = ["level", "points", "contributions", "views"]


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

    existing = load_existing()
    # tiene solo le voci attuali: le vecchie (recensioni, foto) spariscono
    stats = {f: existing[f] for f in FIELDS if f in existing}

    for field in FIELDS:
        value = getattr(args, field).strip()
        if not value:
            continue
        if field == "level":
            if not value.isdigit():
                parser.error("Il livello deve essere un numero (es. 6)")
            stats[field] = int(value)
        else:
            stats[field] = value

    stats["updated"] = date.today().isoformat()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Statistiche salvate in {OUTPUT_PATH}: {stats}")


if __name__ == "__main__":
    main()
