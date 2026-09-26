import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Link-preview card for shares on WhatsApp, X, iMessage, etc.
export const alt = "Zora Stream: movies, TV, anime and live sports";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [font, icon] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Exo2-ExtraBoldItalic.ttf")),
    readFile(join(process.cwd(), "assets/brand/mark-speed.svg"), "utf8"),
  ]);
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 42%, #3a0508 0%, #120304 45%, #000 80%)",
          color: "white",
        }}
      >
        <img src={markSrc} width={344} height={256} alt="" />
        <div style={{ display: "flex", fontFamily: "Exo", fontSize: 92, marginTop: 18, letterSpacing: 2 }}>
          <span>ZORA</span>
          <span style={{ color: "#e3121b", marginLeft: 26 }}>STREAM</span>
        </div>
        <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 14 }}>Movies · TV · Anime · Free classics · Live sports</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Exo", data: font, style: "italic", weight: 800 }] }
  );
}
