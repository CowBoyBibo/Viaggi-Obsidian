import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// Leggiamo i dati con un fallback sicuro per non bloccare mai il build di Quartz
let mapsData = {
  level: 5,
  views: "100k+",
  reviews: "17",
  photos: "38"
}

try {
  mapsData = require("../../content/data/maps_stats.json")
} catch {
  // Se durante il build non trova il file, usa i dati di fallback senza far fallire il sito
}

export const LocalGuide: QuartzComponent = () => {
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
        <div>
          <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{mapsData.views}</strong>
          <span style={{ fontSize: "0.85em", opacity: "0.8" }}>Views Foto</span>
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{mapsData.reviews}</strong>
          <span style={{ fontSize: "0.85em", opacity: "0.8" }}>Recensioni</span>
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{mapsData.photos}</strong>
          <span style={{ fontSize: "0.85em", opacity: "0.8" }}>Foto</span>
        </div>
      </div>
    </div>
  )
}

export default (() => LocalGuide) satisfies QuartzComponentConstructor