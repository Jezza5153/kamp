import { ImageResponse } from "next/og";

export const alt = "Ondernemers van de Kamp — Amersfoort";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #163a29 0%, #0f2a1d 100%)",
          padding: 72,
          color: "#f6f0e2",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#c9822b" }} />
          <div style={{ fontSize: 26, letterSpacing: 8, textTransform: "uppercase", color: "#d9a86a" }}>
            De Kamp · Amersfoort
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>De Kamp</div>
          <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, letterSpacing: -2, color: "#c9822b", fontStyle: "italic" }}>
            leeft.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 30, maxWidth: 760, color: "rgba(246,240,226,0.85)", lineHeight: 1.3 }}>
            Een straatportret van makers, smaken en ondernemersgeest in hartje Amersfoort.
          </div>
          <div style={{ fontSize: 22, color: "rgba(246,240,226,0.6)" }}>ondernemersvandekamp.nl</div>
        </div>
      </div>
    ),
    size,
  );
}
