# Archive of my Journey 旅

Diario di viaggio sul Giappone: itinerari, suggerimenti pratici e racconti dei miei viaggi. Le note sono scritte in [Obsidian](https://obsidian.md) e pubblicate come sito statico con [Quartz](https://quartz.jzhao.xyz).

> Nato come raccolta di appunti personali in Obsidian, pubblicato per condividere con amici e parenti consigli e itinerari sul Giappone.

**Sito:** https://cowboybibo.github.io/Viaggi-Obsidian/

## Come funziona

1. Scrivo le note in Obsidian.
2. Uno script locale (Windows) copia le note e le immagini nella cartella `content/` del repository e fa il push.
3. GitHub Actions costruisce il sito con Quartz, applica il tema e lo pubblica su GitHub Pages.

## Struttura del repository

| Percorso | Contenuto |
| --- | --- |
| `content/` | Note e immagini del blog (copiate dal vault di Obsidian) |
| `content/data/maps_stats.json` | Statistiche del profilo Local Guide mostrate nel widget |
| `quartz/` | Codice di Quartz; `quartz/components/LocalGuide.tsx` è il widget Local Guide |
| `theme/tabi/` | Tema grafico personalizzato (CSS e JavaScript) |
| `tools/apply-tabi.mjs` | Applica il tema alle pagine dopo la build |
| `scripts/update_maps.py` | Aggiorna `maps_stats.json` |
| `.github/workflows/deploy.yml` | Build e pubblicazione su GitHub Pages |
| `.github/workflows/update-maps.yml` | Aggiornamento manuale delle statistiche |

## Statistiche Local Guide

Il widget nella barra laterale mostra livello, contributi, punti e visualizzazioni del mio profilo Google Maps. Google non offre un'API per questi dati, quindi si aggiornano a mano:

1. GitHub → **Actions** → **Aggiorna statistiche Local Guide** → **Run workflow**.
2. Compilare i campi come compaiono nell'app (per esempio `1,7K`); i campi vuoti restano invariati.
3. Il workflow salva il file e il sito si ripubblica da solo.

## Sviluppo in locale

```bash
npm ci
npx quartz build        # costruisce il sito in public/
node tools/apply-tabi.mjs   # applica il tema (lo fa anche il deploy)
```

Per un'anteprima veloce, senza il tema: `npx quartz build --serve`.

## Note di manutenzione

- Il tema legge la struttura del widget: il primo blocco è l'intestazione, l'ultimo è la griglia dei numeri. Non aggiungere altri blocchi dopo la griglia in `LocalGuide.tsx`, altrimenti il widget non compare.
- Il widget non cambia da solo: se dopo un deploy una pagina sembra vecchia, provare una finestra privata o Ctrl+F5.
- Rinominare una nota (anche solo l'emoji nel titolo) cambia il suo indirizzo.

## Crediti e licenza

Costruito con [Quartz](https://github.com/jackyzha0/quartz) di Jacky Zhao, rilasciato con licenza MIT (vedi `LICENSE.txt`). Font: Fraunces, Inter e Noto Serif JP tramite Google Fonts. I testi e le foto del blog sono dell'autore.
