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

function formatDate(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export const LocalGuide: QuartzComponent = () => {
  const updated = formatDate(mapsData.updated)

  const stats = [
    { value: mapsData.contributions, label: "Contributi" },
    { value: mapsData.points, label: "Punti" },
    { value: mapsData.views, label: "Visualizzazioni" },
  ]

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
      {updated && (
        <div style={{ fontSize: "0.7em", opacity: "0.7", textAlign: "center", marginTop: "6px" }}>
          Dati aggiornati al {updated}
        </div>
      )}
    </div>
  )
}

export default (() => LocalGuide) satisfies QuartzComponentConstructor
