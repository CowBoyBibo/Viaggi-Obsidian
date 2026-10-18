import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import mapsData from "../../content/data/maps_stats.json"

export const LocalGuide: QuartzComponent = () => {
  const level = mapsData.level || 5
  const views = mapsData.views || "100k+"
  const reviews = mapsData.reviews || "17"
  const photos = mapsData.photos || "38"

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
          <div style={{ fontSize: "0.75em", color: "var(--gray)" }}>Livello {level} • Contributore Reale</div>
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
          <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{views}</strong>
          <span style={{ fontSize: "0.85em", opacity: "0.8" }}>Views Foto</span>
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{reviews}</strong>
          <span style={{ fontSize: "0.85em", opacity: "0.8" }}>Recensioni</span>
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "1.1em", color: "var(--secondary)" }}>{photos}</strong>
          <span style={{ fontSize: "0.85em", opacity: "0.8" }}>Foto</span>
        </div>
      </div>
    </div>
  )
}

export default (() => LocalGuide) satisfies QuartzComponentConstructor