# Tema Tabi — Washi / Sumi

Livello visivo additivo per Archive of my Journey. Non modifica i contenuti né i
componenti Quartz: viene applicato alla build, in `public/`.

## Cosa contiene

- `theme.css` — token Washi/Sumi, tipografia, componenti, fondo con il kanji 旅.
- `theme.js` — tema predefinito Sumi, navigazione SPA, figure, dittici, tabelle,
  ticker, scheda Local Guide, movimento e fondo.
- `../tools/apply-tabi.mjs` — copia gli asset in `public/_theme` e inserisce i tag
  in ogni HTML. È idempotente.

## Uso locale

```bash
npx quartz build
node tools/apply-tabi.mjs
```

Oppure:

```bash
npm run tabi
```

## Deploy

Il workflow `.github/workflows/deploy.yml` esegue `node tools/apply-tabi.mjs`
subito dopo `npx quartz build`, prima di caricare `public/` su GitHub Pages.
Non serve modificare i Markdown.

## Note

- Sumi è il tema predefinito; Washi resta a un clic e le preferenze sono salvate in
  `localStorage`.
- `?theme=washi` e `?theme=sumi` forzano il tema senza salvare la scelta.
- Il tema vive sopra la build: per portarlo dentro `quartz/styles` e
  `quartz/components` serve un lavoro separato.
- I font arrivano da Google Fonts; per la produzione conviene self-hostarli.
