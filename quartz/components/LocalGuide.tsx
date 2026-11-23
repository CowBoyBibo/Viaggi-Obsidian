import { QuartzComponent, QuartzComponentConstructor } from "./types"

type MapsStats = {
  level: number | string
  points: string
  contributions: string
  views: string
  updated?: string
}

// Dati di riserva: se il file JSON manca o è incompleto il build non fallisce
let mapsData: MapsStats = {
  level: 6,
  points: "1,7K",
  contributions: "464",
  views: "150K",
}

try {
  mapsData = { ...mapsData, ...require("../../content/data/maps_stats.json") }
} catch {
  // Se durante il build non trova il file, usa i dati di riserva senza far fallire il sito
}

export const LocalGuide: QuartzComponent = () => {
  const stats = [
    { value: mapsData.contributions, label: "Contributi" },
    { value: mapsData.points, label: "Punti" },
    { value: mapsData.views, label: "Visualizzazioni" },
  ]

  // ATTENZIONE: il tema Tabi (theme/tabi/theme.js) legge questa struttura:
  // il PRIMO blocco è l'intestazione, l'ULTIMO blocco è la griglia dei numeri.
  // Non aggiungere altri blocchi dopo la griglia, altrimenti il widget sparisce.
  return (
    <div className="local-guide-widget" style={{
      background: "var(--lightgray)",
      border: "1px solid var(--gray)",
      borderRadius: "8px",
      padding: "12px",
      margin: "15px 0"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <span style={{ fontSize: "1.4em" }}>🛑</span>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "0.9em", lineHeight: "1.1" }}>Google Local Guide</div>
          <div style={{ fontSize: "0.75em", color: "var(--gray)" }}>Livello {mapsData.level} • Contributore Reale</div>
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "6px",
        fontSize: "0.8em",
        textAlign: "center",
        background: "var(--pageBackground)",
        padding: "8px",
        borderRadius: "6px"
      }}>
        {stats.map((s) => (
          <div>
            <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{s.value}</strong>
            <span style={{ fontSize: "0.8em", opacity: "0.8", overflowWrap: "anywhere" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default (() => LocalGuide) satisfies QuartzComponentConstructor
