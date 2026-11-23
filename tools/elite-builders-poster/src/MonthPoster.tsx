import { AbsoluteFill, Img, staticFile } from "remotion";
import { monthName, monthRanking } from "./roster";
import { DISPLAY, GOLD, GoldText, Grain, INK, LABEL, OpenSlot, Stars, Tile, fontFaces, layoutGrid } from "./Poster";

const W = 1080;
const H = 1350;
const PAD = 34;
const HEADER_H = 236;
const FOOTER_H = 62;
const TOTALS_H = 112;

/**
 * Month recap: every builder with a direct in that month, ranked by monthRanking.
 * Stars count that month's directs only. Builders without a photo show their initials.
 */
export const MonthPoster = ({ month }: { month: string }) => {
  // month = "2026-11"
  const inMonth = (d: string) => d.startsWith(month);
  const builders = monthRanking(month);
  const total = builders.reduce((n, x) => n + x.n, 0);
  const lastDay = builders.flatMap((x) => x.b.directs.filter(inMonth)).sort().pop()!;

  const bodyTop = HEADER_H + 10;
  const gridH = H - bodyTop - FOOTER_H - TOTALS_H - 40;
  const gridW = W - PAD * 2;
  const grid = layoutGrid(builders.length, gridW, gridH - 48, 14);
  const openSlots = grid.cols * grid.rows - builders.length;

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <style>{fontFaces}</style>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(41,98,255,.42), transparent 70%),
                       radial-gradient(ellipse 60% 50% at 20% 75%, rgba(13,54,217,.16), transparent 70%),
                       linear-gradient(180deg, #050b24 0%, ${INK} 55%, #000 100%)`,
        }}
      />

      {/* header */}
      <div style={{ position: "absolute", top: 34, left: PAD, right: PAD, height: HEADER_H - 34 }}>
        <Img src={staticFile("logo.png")} style={{ position: "absolute", right: 0, top: 0, width: 138 }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 112, lineHeight: 0.95, color: "#fff", letterSpacing: 2, textShadow: `0 0 36px rgba(41,98,255,.55)` }}>
          {monthName(`${month}-01`)}
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 38, letterSpacing: 9, color: "#fff", marginTop: 6 }}>
          ELITE BUILDERS <GoldText>OF THE MONTH</GoldText>
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 600, fontSize: 20, letterSpacing: 5, color: "#9db4ff", marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          {month.slice(0, 4)} · {builders.length} BUILDERS · {total} DIRECTS ·
          <Stars n={1} size={18} />= 1 DIRECT
        </div>
      </div>

      {/* grid */}
      <div style={{ position: "absolute", left: PAD, top: bodyTop, width: gridW }}>
        <div style={{ height: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: "#fff", whiteSpace: "nowrap" }}>THE ELITE LINE-UP</div>
          <div style={{ flex: 1, height: 1.5, background: GOLD, opacity: 0.8 }} />
        </div>
        <div
          style={{
            marginTop: 8,
            height: gridH - 48,
            display: "grid",
            gridTemplateColumns: `repeat(${grid.cols}, ${grid.tw}px)`,
            gridAutoRows: `${grid.th}px`,
            gap: 14,
            justifyContent: "center",
            alignContent: "start",
          }}
        >
          {builders.map((x) => (
            <Tile key={x.b.id} b={{ ...x.b, since: x.first }} date={lastDay} w={grid.tw} h={grid.th} stars={x.n} />
          ))}
          {Array.from({ length: openSlots }).map((_, i) => (
            <OpenSlot key={`open-${i}`} w={grid.tw} h={grid.th} />
          ))}
        </div>
      </div>

      {/* totals */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          bottom: FOOTER_H + 10,
          height: TOTALS_H,
          borderRadius: 12,
          border: "1.5px solid rgba(246,200,69,.6)",
          background: "linear-gradient(180deg, rgba(13,54,217,.35), rgba(1,3,9,.9))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 52, lineHeight: 1 }}>{builders.length}</div>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#c9d6ff" }}>ELITE BUILDERS</div>
        </div>
        <div style={{ width: 1, height: 64, background: "rgba(246,200,69,.5)" }} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 52, lineHeight: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            {total}
            <Stars n={1} size={30} />
          </div>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#c9d6ff" }}>{monthName(`${month}-01`)} DIRECTS</div>
        </div>
        <div style={{ width: 1, height: 64, background: "rgba(246,200,69,.5)" }} />
        <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 22, letterSpacing: 2, lineHeight: 1.25 }}>
          REFER A PARTNER
          <br />
          <GoldText>YOU&apos;RE NEXT</GoldText>
        </div>
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
        }}
      >
        JDC ELITE SOCIETY
      </div>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
