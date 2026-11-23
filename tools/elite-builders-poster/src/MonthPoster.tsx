import { AbsoluteFill, Img, staticFile } from "remotion";
import { monthName, monthRanking } from "./roster";
import { BRAND, DISPLAY, GOLD, GoldText, Grain, INK, LABEL, OpenSlot, Stars, Tile, fontFaces, layoutGrid } from "./Poster";

const W = 1080;
const H = 1350;
const PAD = 34;
const HEADER_H = 236;
const FOOTER_H = 62;
const TOP_H = 470;

/**
 * Month recap: the builders with the most directs that month share a highlighted panel at the top,
 * everyone else follows below in ranking order. Counts that month's directs only.
 */
export const MonthPoster = ({ month }: { month: string }) => {
  const builders = monthRanking(month);
  const best = builders[0].n;
  const leaders = builders.filter((x) => x.n === best);
  // line-up below the leaders: newest first (latest first direct of the month at the top-left)
  const rest = builders.filter((x) => x.n !== best).sort((a, b) => b.first.localeCompare(a.first));
  const total = builders.reduce((n, x) => n + x.n, 0);
  const mon = monthName(`${month}-01`);

  const topY = HEADER_H + 4;
  const restY = topY + TOP_H + 22;
  const headH = 40;
  const gridH = H - FOOTER_H - 14 - restY - headH - 8;
  const gridW = W - PAD * 2;
  const grid = layoutGrid(rest.length, gridW, gridH, 12);
  const openSlots = grid.cols * grid.rows - rest.length;

  const lg = 18;
  const ltw = Math.min(300, (gridW - 4 - 40 - lg * (leaders.length - 1)) / leaders.length);
  const lth = TOP_H - 4 - 110;
  const left0 = (gridW - 4 - (ltw * leaders.length + lg * (leaders.length - 1))) / 2;

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
          {mon}
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 38, letterSpacing: 9, color: "#fff", marginTop: 6 }}>
          ELITE BUILDERS <GoldText>OF THE MONTH</GoldText>
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 600, fontSize: 20, letterSpacing: 5, color: "#9db4ff", marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          {month.slice(0, 4)} · {builders.length} BUILDERS · {total} DIRECTS ·
          <Stars n={1} size={18} />= 1 DIRECT
        </div>
      </div>

      {/* leaders */}
      <div style={{ position: "absolute", left: PAD, top: topY, width: gridW, height: TOP_H, borderRadius: 18, overflow: "hidden", padding: 2, background: "linear-gradient(160deg, #fff0b0, #b8860b 40%, #5a4108 60%, #f6c845)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", background: "linear-gradient(180deg, #0a1640 0%, #040817 60%, #000 100%)" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(41,98,255,.45), transparent 70%)" }} />
          <Grain opacity={0.2} />
          <div style={{ position: "absolute", top: 20, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, color: "#fff" }}>
            <Stars n={best} size={40} />
            <div style={{ padding: "5px 16px", background: BRAND, fontFamily: LABEL, fontWeight: 700, fontSize: 24, letterSpacing: 4, transform: "skewX(-10deg)", borderRadius: 4 }}>
              {leaders.length > 1 ? `TOP BUILDERS · ${best} DIRECTS EACH` : `TOP BUILDER · ${best} DIRECTS`}
            </div>
          </div>
          {leaders.map((x, i) => (
            <div key={x.b.id} style={{ position: "absolute", left: left0 + i * (ltw + lg), top: 96, width: ltw, height: lth }}>
              <Tile b={{ ...x.b, since: x.first }} date={x.reached} w={ltw} h={lth} stars={x.n} />
            </div>
          ))}
        </div>
      </div>

      {/* everyone else */}
      <div style={{ position: "absolute", left: PAD, top: restY, width: gridW }}>
        <div style={{ height: headH, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: "#fff", whiteSpace: "nowrap" }}>THE ELITE LINE-UP</div>
          <div style={{ flex: 1, height: 1.5, background: GOLD, opacity: 0.8 }} />
        </div>
        <div
          style={{
            marginTop: 8,
            height: gridH,
            display: "grid",
            gridTemplateColumns: `repeat(${grid.cols}, ${grid.tw}px)`,
            gridAutoRows: `${grid.th}px`,
            gap: 12,
            justifyContent: "center",
            alignContent: "start",
          }}
        >
          {rest.map((x) => (
            <Tile key={x.b.id} b={{ ...x.b, since: x.first }} date={x.reached} w={grid.tw} h={grid.th} stars={x.n} />
          ))}
          {Array.from({ length: openSlots }).map((_, i) => (
            <OpenSlot key={`open-${i}`} w={grid.tw} h={grid.th} />
          ))}
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
