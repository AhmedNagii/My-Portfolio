import { ImageResponse } from "next/og";
import { profile } from "@/content";

export const alt = `${profile.name}, ${profile.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A rising line with the same shape as the hero chart.
function line(): string {
  const pts: string[] = [];
  for (let x = 0; x <= 1200; x += 20) {
    const f = x / 1200;
    pts.push(`${x},${(630 * (0.9 - 0.42 * Math.pow(f, 1.8) + 0.012 * Math.sin(15 * f))).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#16191F", color: "#FFFFFF", padding: 72, position: "relative" }}>
        <div style={{ fontSize: 28, color: "#A2A3A5", fontFamily: "monospace" }}>{"<AN />"}</div>
        <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -4, marginTop: 40 }}>{profile.name}</div>
        <div style={{ fontSize: 38, color: "#A2A3A5", marginTop: 12 }}>{profile.tagline}</div>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={line()} fill="none" stroke="#307EF2" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
