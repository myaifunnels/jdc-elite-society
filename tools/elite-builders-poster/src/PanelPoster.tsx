import { AbsoluteFill, Img, staticFile } from "remotion";
import type { PanelSpec } from "./roster";
import { BRAND, DEEP, DISPLAY, Grain, INK, LABEL, fontFaces } from "./Poster";

const W = 1080;
const H = 1350;
const BOX_X = 40;
const BOX_Y = 440;
const BOX_W = W - BOX_X * 2;
const PHOTO_H = 640;
const PLATE_H = 150;
const SILVER = "linear-gradient(180deg, #ffffff 0%, #dfe6f5 45%, #8f9bb8 100%)";

const silverText: React.CSSProperties = {
  background: SILVER,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  filter: "drop-shadow(0 4px 10px rgba(0,0,0,.6))",
};

/** Owner's month layout: centred logo + title, one tall photo panel per builder, skewed name plates below. */
export const PanelPoster = ({ spec }: { spec: PanelSpec }) => {
  const n = spec.builders.length;
  const pw = BOX_W / n;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <style>{fontFaces}</style>
      {/* backdrop: blue glow, light rays and angled bands */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 35% at 50% 18%, rgba(41,98,255,.55), transparent 70%),
                       linear-gradient(180deg, #061436 0%, #030a1f 45%, ${INK} 100%)`,
        }}
      />
      <AbsoluteFill style={{ background: "conic-gradient(from 180deg at 50% -10%, transparent 0deg 160deg, rgba(90,140,255,.10) 168deg, transparent 176deg 184deg, rgba(90,140,255,.10) 192deg, transparent 200deg)" }} />
      <div style={{ position: "absolute", left: 0, top: 150, width: 330, height: 220, background: "linear-gradient(90deg, rgba(13,54,217,.45), rgba(13,54,217,.05))", clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", right: 0, top: 190, width: 300, height: 190, background: "linear-gradient(270deg, rgba(13,54,217,.45), rgba(13,54,217,.05))", clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)" }} />
      {/* corner brackets */}
      {[
        { left: 24, top: 24, b: "borderLeft", c: "borderTop" },
        { right: 24, top: 24, b: "borderRight", c: "borderTop" },
        { left: 24, bottom: 24, b: "borderLeft", c: "borderBottom" },
        { right: 24, bottom: 24, b: "borderRight", c: "borderBottom" },
      ].map(({ b, c, ...pos }, i) => (
        <div key={i} style={{ position: "absolute", ...pos, width: 46, height: 46, [b]: "2px solid rgba(255,255,255,.35)", [c]: "2px solid rgba(255,255,255,.35)" }} />
      ))}

      {/* header */}
      <Img src={staticFile("logo.png")} style={{ position: "absolute", left: (W - 260) / 2, top: 20, width: 260, filter: "drop-shadow(0 0 24px rgba(41,98,255,.6))" }} />
      <div style={{ position: "absolute", top: 198, left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, letterSpacing: 4 }}>
        <span style={silverText}>{spec.title}</span>
      </div>
      <div style={{ position: "absolute", top: 352, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <div style={{ width: 160, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.7))" }} />
        <div style={{ fontFamily: LABEL, fontWeight: 800, fontSize: 46, letterSpacing: 9, color: "#fff", textShadow: "0 0 20px rgba(41,98,255,.7)" }}>{spec.tag}</div>
        <div style={{ width: 160, height: 2, background: "linear-gradient(270deg, transparent, rgba(255,255,255,.7))" }} />
      </div>
      <div style={{ position: "absolute", top: 414, left: 0, right: 0, textAlign: "center", fontFamily: LABEL, fontWeight: 700, fontSize: 18, letterSpacing: 10, color: BRAND }}>{spec.year}</div>

      {/* panels */}
      <div style={{ position: "absolute", left: BOX_X, top: BOX_Y + 16, width: BOX_W, height: PHOTO_H + PLATE_H, borderRadius: 18, overflow: "hidden", background: "#050c22", boxShadow: "0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(90,140,255,.25)" }}>
        {spec.builders.map((b, i) => {
          const ih = PHOTO_H * b.zoom;
          return (
            <div key={b.first} style={{ position: "absolute", left: i * pw, top: 0, width: pw, height: PHOTO_H, overflow: "hidden", background: `linear-gradient(180deg, #1b3f9e 0%, #0a1d55 55%, #050c22 100%)` }}>
              {/* the face point sits at the panel's horizontal centre, 26% down */}
              <Img
                src={staticFile(b.photo)}
                style={{ position: "absolute", height: ih, width: ih * b.ar, top: PHOTO_H * 0.26 - b.fy * ih, left: pw / 2 - b.fx * ih * b.ar }}
              />
              {/* blue grade + bottom fade */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,54,217,.18), rgba(13,54,217,.32))", mixBlendMode: "color" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 70%, rgba(5,12,34,.9) 100%)" }} />
              {i > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg, rgba(120,160,255,.9), rgba(41,98,255,.4))", boxShadow: "0 0 14px rgba(41,98,255,.8)" }} />}
            </div>
          );
        })}
        {/* name plates */}
        <div style={{ position: "absolute", left: 0, top: PHOTO_H, width: BOX_W, height: PLATE_H, background: `linear-gradient(180deg, ${DEEP} 0%, #0a2477 100%)` }}>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(115deg, rgba(255,255,255,.04) 0 2px, transparent 2px 14px)" }} />
          {spec.builders.map((b, i) => (
            <div key={b.first} style={{ position: "absolute", left: i * pw, top: 0, width: pw, height: PLATE_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 58, lineHeight: 1, letterSpacing: 1 }}>
                <span style={silverText}>{b.first.toUpperCase()}</span>
              </div>
              <div style={{ width: 46, height: 2, background: "rgba(255,255,255,.75)", margin: "12px 0 10px" }} />
              <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: "#dfe6f5" }}>{b.last.toUpperCase()}</div>
              {i > 0 && <div style={{ position: "absolute", left: -10, top: 30, width: 20, height: PLATE_H - 60, background: "linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.15))", transform: "skewX(-20deg)" }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: LABEL, fontWeight: 700, fontSize: 22, letterSpacing: 12, color: "#fff" }}>JDC ELITE SOCIETY</div>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
