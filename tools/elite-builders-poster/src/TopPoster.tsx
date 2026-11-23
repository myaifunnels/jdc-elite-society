import { AbsoluteFill, Img, staticFile } from "remotion";
import { monthName, monthRanking } from "./roster";
import { BRAND, DEEP, DISPLAY, GOLD, GoldText, Grain, INK, LABEL, OpenSlot, Stars, Tile, fontFaces } from "./Poster";

const W = 1080;
const H = 1350;
const PAD = 34;
const HEADER_H = 232;
const FOOTER_H = 62;

const RankBadge = ({ rank, size }: { rank: number; size: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: GOLD,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: DISPLAY,
      fontSize: size * 0.52,
      color: INK,
      boxShadow: "0 4px 12px rgba(0,0,0,.6)",
      border: `${Math.max(2, size * 0.05)}px solid ${INK}`,
    }}
  >
    {rank}
  </div>
);

/** Top 5 builders of a month: #1 in a big hero panel, #2-#5 below. Counts that month's directs only. */
export const TopPoster = ({ month }: { month: string }) => {
  const top = monthRanking(month).slice(0, 5);
  const ranks = top.map((x) => 1 + top.filter((y) => y.n > x.n).length);
  const leaders = top.filter((_, i) => ranks[i] === 1);
  const tied = leaders.length > 1;
  const first = top[0];
  const rest = tied ? top.slice(leaders.length) : top.slice(1);
  const restRank = (i: number) => (tied ? leaders.length + i + 1 : i + 2);
  const mon = monthName(`${month}-01`);

  const heroTop = HEADER_H + 6;
  const heroH = 520;
  const rowTop = heroTop + heroH + 24;
  const gap = 14;
  const tileW = (W - PAD * 2 - gap * 3) / 4;
  const ctaH = 84;
  const tileH = H - FOOTER_H - ctaH - 22 - rowTop - 16;
  const hb = first.b;

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <style>{fontFaces}</style>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(41,98,255,.42), transparent 70%),
                       radial-gradient(ellipse 60% 50% at 80% 70%, rgba(13,54,217,.18), transparent 70%),
                       linear-gradient(180deg, #050b24 0%, ${INK} 55%, #000 100%)`,
        }}
      />

      {/* header */}
      <div style={{ position: "absolute", top: 34, left: PAD, right: PAD, height: HEADER_H - 34 }}>
        <Img src={staticFile("logo.png")} style={{ position: "absolute", right: 0, top: 0, width: 138 }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 112, lineHeight: 0.95, color: "#fff", letterSpacing: 2, textShadow: `0 0 36px rgba(41,98,255,.55)` }}>
            TOP 5
          </div>
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 38, letterSpacing: 9, color: "#fff", marginTop: 6 }}>
          ELITE BUILDERS · <GoldText>{mon}</GoldText>
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 600, fontSize: 20, letterSpacing: 5, color: "#9db4ff", marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          {mon} {month.slice(0, 4)} DIRECTS ONLY ·
          <Stars n={1} size={18} />= 1 DIRECT
        </div>
      </div>

      {/* #1 shared by a tie */}
      {tied && (
        <div style={{ position: "absolute", left: PAD, top: heroTop, width: W - PAD * 2, height: heroH, borderRadius: 18, overflow: "hidden", padding: 2, background: "linear-gradient(160deg, #fff0b0, #b8860b 40%, #5a4108 60%, #f6c845)" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", background: "linear-gradient(180deg, #0a1640 0%, #040817 60%, #000 100%)" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(41,98,255,.45), transparent 70%)" }} />
            <Grain opacity={0.2} />
            <div style={{ position: "absolute", top: 18, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, color: "#fff" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 84, lineHeight: 1 }}>
                <GoldText>#1</GoldText>
              </div>
              <div
                style={{ padding: "5px 16px", background: BRAND, fontFamily: LABEL, fontWeight: 700, fontSize: 24, letterSpacing: 4, transform: "skewX(-10deg)", borderRadius: 4 }}
              >
                TIED · {first.n} DIRECTS EACH
              </div>
            </div>
            {(() => {
              const g = 18;
              const tw = Math.min(300, (W - PAD * 2 - 4 - 40 - g * (leaders.length - 1)) / leaders.length);
              const th = heroH - 4 - 128;
              const left0 = (W - PAD * 2 - 4 - (tw * leaders.length + g * (leaders.length - 1))) / 2;
              return leaders.map((x, i) => (
                <div key={x.b.id} style={{ position: "absolute", left: left0 + i * (tw + g), top: 112, width: tw, height: th }}>
                  <Tile b={{ ...x.b, since: x.first }} date={x.reached} w={tw} h={th} stars={x.n} />
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* #1 hero */}
      {!tied && <div style={{ position: "absolute", left: PAD, top: heroTop, width: W - PAD * 2, height: heroH, borderRadius: 18, overflow: "hidden", padding: 2, background: "linear-gradient(160deg, #fff0b0, #b8860b 40%, #5a4108 60%, #f6c845)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 55% 70% at 68% 40%, rgba(41,98,255,.42), transparent 70%),
                           linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 32%),
                           linear-gradient(180deg, #0a1640 0%, #040817 55%, #000 100%)`,
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 80% at 60% 45%, transparent 55%, rgba(0,0,0,.75) 100%)" }} />
          <Grain opacity={0.22} />
          {hb.photo && (
            <Img
              src={staticFile(hb.photo)}
              style={{
                position: "absolute",
                height: heroH * 0.98,
                left: "68%",
                top: 24,
                transform: "translateX(-50%)",
                filter: "drop-shadow(-3px 0 6px rgba(150,190,255,.35)) drop-shadow(4px 0 10px rgba(255,214,170,.18)) contrast(1.04)",
              }}
            />
          )}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: heroH * 0.3, background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,.8) 100%)" }} />
          <div style={{ position: "absolute", left: 40, top: 40, width: 460, color: "#fff" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.85 }}>
              <GoldText>#1</GoldText>
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "5px 16px",
                background: BRAND,
                fontFamily: LABEL,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 4,
                transform: "skewX(-10deg)",
                borderRadius: 4,
                marginTop: 22,
              }}
            >
              TOP BUILDER OF {mon}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 104, lineHeight: 0.92, letterSpacing: 1, marginTop: 18, textShadow: "0 4px 18px rgba(0,0,0,.7)" }}>
              {hb.first.toUpperCase()}
            </div>
            <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: "#e6ecff", marginTop: 8 }}>{hb.last.toUpperCase()}</div>
            <div style={{ marginTop: 18, display: "flex" }}>
              <Stars n={first.n} size={40} />
            </div>
            <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: "#c9d6ff", marginTop: 10 }}>
              {first.n} DIRECT{first.n === 1 ? "" : "S"} IN {mon}
            </div>
          </div>
        </div>
      </div>

      }

      {/* the rest */}
      {rest.map((x, i) => (
        <div key={x.b.id} style={{ position: "absolute", left: PAD + i * (tileW + gap), top: rowTop, width: tileW, height: tileH }}>
          <Tile b={{ ...x.b, since: x.first }} date={x.reached} w={tileW} h={tileH} stars={x.n} />
          <div style={{ position: "absolute", right: -8, top: -12 }}>
            <RankBadge rank={restRank(i)} size={54} />
          </div>
        </div>
      ))}

      {Array.from({ length: Math.max(0, 4 - rest.length) }).map((_, i) => (
        <div key={`open-${i}`} style={{ position: "absolute", left: PAD + (rest.length + i) * (tileW + gap), top: rowTop, width: tileW, height: tileH }}>
          <OpenSlot w={tileW} h={tileH} />
        </div>
      ))}

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          bottom: FOOTER_H + 10,
          height: ctaH,
          borderRadius: 12,
          border: "1.5px solid rgba(246,200,69,.6)",
          background: `linear-gradient(180deg, rgba(13,54,217,.35), rgba(1,3,9,.9))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          color: "#fff",
          fontFamily: LABEL,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 3,
        }}
      >
        REFER A PARTNER · <GoldText>DECEMBER&apos;S TOP 5 COULD BE YOU</GoldText>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: FOOTER_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: LABEL,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 12,
          color: "#fff",
          background: `linear-gradient(90deg, transparent, ${DEEP}22, transparent)`,
        }}
      >
        JDC ELITE SOCIETY
      </div>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
