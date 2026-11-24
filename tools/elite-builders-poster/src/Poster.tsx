import { AbsoluteFill, Img, staticFile } from "remotion";
import { Builder, ROSTER, joinedBy, monthName, shortDate, starsOn } from "./roster";

// Brand (JDC cobalt / chrome, dark mode)
export const BRAND = "#2962ff";
export const DEEP = "#0d36d9";
export const INK = "#010309";
export const GOLD = "linear-gradient(180deg, #fff0b0 0%, #f6c845 45%, #b8860b 100%)";
const GOLD_SOLID = "#f6c845";

export const fontFaces = `
@font-face { font-family: 'Display'; src: url('${staticFile("fonts/anton-latin-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Label'; font-weight: 400; src: url('${staticFile("fonts/barlow-condensed-latin-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Label'; font-weight: 600; src: url('${staticFile("fonts/barlow-condensed-latin-600-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Label'; font-weight: 700; src: url('${staticFile("fonts/barlow-condensed-latin-700-normal.woff2")}') format('woff2'); }
`;
export const DISPLAY = "'Display', Impact, 'Arial Narrow Bold', sans-serif";
export const LABEL = "'Label', 'Segoe UI', sans-serif";

const W = 1080;
const H = 1350;
const HEADER_H = 200;
const FOOTER_H = 62;
const LEFT_W = 430;
const GAP = 26;
const PAD = 34;
// Line-up framing: eye-to-chin as a share of tile width, eye line as a share of the photo area height.
const HEAD = 0.16;
const EYE_Y = 0.3;

export const Stars = ({ n, size }: { n: number; size: number }) => (
  <div style={{ display: "flex", gap: size * 0.18, justifyContent: "center" }}>
    {Array.from({ length: n }).map((_, i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }}>
        <defs>
          <linearGradient id={`g${i}-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff0b0" />
            <stop offset=".5" stopColor="#f6c845" />
            <stop offset="1" stopColor="#b8860b" />
          </linearGradient>
        </defs>
        <path d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9 5.6 21.4 7 14.3 1.7 9.3l7.2-.9z" fill={`url(#g${i}-${size})`} />
      </svg>
    ))}
  </div>
);

export const GoldText = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span style={{ background: GOLD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", ...style }}>{children}</span>
);

export const Grain = ({ opacity }: { opacity: number }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

/** Line-up grid: picks the column count that gives the biggest tiles that still fit. */
export function layoutGrid(count: number, w: number, h: number, gap: number) {
  const slots = count + 1; // always leave at least one open "your name" slot
  let best = { cols: 1, rows: slots, tw: 0, th: 0 };
  for (let cols = 2; cols <= 8; cols++) {
    const rows = Math.ceil(slots / cols);
    const tw = (w - gap * (cols - 1)) / cols;
    const th = Math.min((h - gap * (rows - 1)) / rows, tw * 1.62);
    const twFit = Math.min(tw, th / 1.15);
    if (twFit * th > best.tw * best.th) best = { cols, rows, tw: twFit, th };
  }
  return best;
}

const Initials = ({ b, size }: { b: Builder; size: number }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: DISPLAY,
      fontSize: size,
      color: "rgba(255,255,255,.18)",
      letterSpacing: 2,
    }}
  >
    {b.first[0]}
    {b.last[0]}
  </div>
);

export const Tile = ({ b, date, w, h, stars }: { b: Builder; date: string; w: number; h: number; stars?: number }) => {
  const photoH = h * 0.66;
  const s = w / 180; // type scale relative to a 180px tile
  // Same scale and height for everyone: eye-to-chin spans HEAD of the tile width, the face is
  // centred horizontally, and the eye line sits at EYE_Y of the photo area.
  const face = b.face ?? { cx: 0.5, eye: 0.25, chin: 0.4 };
  const imgW = (HEAD * w) / (face.chin - face.eye);
  const imgLeft = (w - 4) / 2 - face.cx * imgW;
  const imgTop = EYE_Y * photoH - face.eye * imgW;
  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        borderRadius: 10,
        padding: 2,
        background: "linear-gradient(160deg, #fff0b0, #b8860b 40%, #5a4108 60%, #f6c845)",
        boxShadow: "0 8px 22px rgba(0,0,0,.55)",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 8, overflow: "hidden", background: "#000" }}>
        {/* black studio backdrop */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 50% 28%, #1b1f2b 0%, #07080c 60%, #000 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: photoH, overflow: "hidden" }}>
          {b.photo ? (
            <Img
              src={staticFile(b.photo)}
              style={{ position: "absolute", width: imgW, left: imgLeft, top: imgTop }}
            />
          ) : (
            <Initials b={b} size={52 * s} />
          )}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: photoH * 0.35, background: "linear-gradient(180deg, transparent, #000)" }} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 7 * s,
            left: 7 * s,
            padding: `${2 * s}px ${7 * s}px`,
            background: DEEP,
            color: "#fff",
            fontFamily: LABEL,
            fontWeight: 700,
            fontSize: 12 * s,
            letterSpacing: 1.5 * s,
            borderRadius: 3,
            transform: "skewX(-10deg)",
          }}
        >
          {shortDate(b.since ?? b.directs[0])}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: Math.min(photoH - 8 * s, h - 4 - 92 * s), textAlign: "center", color: "#fff" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 34 * s, lineHeight: 1, letterSpacing: 0.5 }}>{b.first.toUpperCase()}</div>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 13 * s, letterSpacing: 2 * s, color: "#dfe6ff", marginTop: 3 * s }}>
            {b.last.toUpperCase()}
          </div>
          <div style={{ width: 46 * s, height: 1.5 * s, margin: `${6 * s}px auto`, background: GOLD }} />
          <Stars n={stars ?? starsOn(b, date)} size={15 * s} />
        </div>
      </div>
    </div>
  );
};

export const OpenSlot = ({ w, h }: { w: number; h: number }) => {
  const s = w / 180;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 10,
        border: `${2 * s}px dashed rgba(246,200,69,.55)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textAlign: "center",
        background: "rgba(10,20,60,.35)",
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontSize: 46 * s, lineHeight: 1, color: GOLD_SOLID }}>+</div>
      <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 15 * s, letterSpacing: 1.5 * s, marginTop: 6 * s, lineHeight: 1.15 }}>
        YOUR NAME
        <br />
        COULD BE HERE
      </div>
    </div>
  );
};

export const Poster = ({ date, builder, chip }: { date: string; builder: string; chip?: string }) => {
  const star = ROSTER.find((b) => b.id === builder);
  if (!star) throw new Error(`Unknown builder ${builder}`);
  // The card is a month card ("NOVEMBER"), so only builders with a direct in that month so far.
  // October-only builders (on the October and all-time posters) stay off it.
  const month = date.slice(0, 7);
  const everyone = ROSTER.filter((b) => joinedBy(b, date) && b.directs.some((d) => d.startsWith(month) && d <= date));
  const lineup = everyone.filter((b) => b.id !== builder);
  // newest first: stable sort by join date descending, later roster entries first on ties
  lineup.sort((a, b) => {
    const da = a.since ?? a.directs[0];
    const db = b.since ?? b.directs[0];
    if (da !== db) return da < db ? 1 : -1;
    return ROSTER.indexOf(b) - ROSTER.indexOf(a);
  });
  const totalDirects = everyone.reduce((n, b) => n + starsOn(b, date), 0);
  const heroStars = starsOn(star, date);

  const bodyTop = HEADER_H + 18;
  const bodyH = H - bodyTop - FOOTER_H - 14;
  const rightX = PAD + LEFT_W + GAP;
  const rightW = W - rightX - PAD;
  const LINEUP_HEAD = 44;
  const TOTALS_H = 112;
  const gridH = bodyH - LINEUP_HEAD - TOTALS_H - 30;
  const grid = layoutGrid(lineup.length, rightW, gridH, 12);
  const openSlots = grid.cols * grid.rows - lineup.length;
  const hero = star.hero ?? { height: 1, x: 0, y: 0 };

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <style>{fontFaces}</style>
      {/* page background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(41,98,255,.38), transparent 70%),
                       radial-gradient(ellipse 60% 50% at 80% 70%, rgba(13,54,217,.18), transparent 70%),
                       linear-gradient(180deg, #050b24 0%, ${INK} 55%, #000 100%)`,
        }}
      />

      {/* header */}
      <div style={{ position: "absolute", top: 34, left: PAD, right: PAD, height: HEADER_H - 34 }}>
        <Img src={staticFile("logo.png")} style={{ position: "absolute", right: 0, top: 0, width: 138 }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 104, lineHeight: 0.95, color: "#fff", letterSpacing: 2, textShadow: `0 0 36px rgba(41,98,255,.55)` }}>
          {monthName(date)}
        </div>
        <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 36, letterSpacing: 9, color: "#fff", marginTop: 6 }}>ELITE BUILDERS</div>
        <div style={{ fontFamily: LABEL, fontWeight: 600, fontSize: 20, letterSpacing: 5, color: "#9db4ff", marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
          {date.slice(0, 4)} · {everyone.length} BUILDERS ·
          <Stars n={1} size={18} />= 1 DIRECT
        </div>
      </div>

      {/* builder of the day */}
      <div style={{ position: "absolute", left: PAD, top: bodyTop, width: LEFT_W, height: bodyH, borderRadius: 18, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 75% 45% at 50% 32%, rgba(41,98,255,.42), transparent 70%),
                         linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 32%),
                         linear-gradient(180deg, #0a1640 0%, #040817 55%, #000 100%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 80% at 50% 45%, transparent 55%, rgba(0,0,0,.75) 100%)" }} />
        <Grain opacity={0.22} />
        {star.photo ? (
          // studio light: warm key, cool rim — never a blue glow on the person.
          // The light sits on a wrapper so a fade mask on the cutout never clips its glow.
          <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(-3px 0 6px rgba(150,190,255,.35)) drop-shadow(4px 0 10px rgba(255,214,170,.18)) contrast(1.04)" }}>
            <Img
              src={staticFile(star.photo)}
              style={{
                position: "absolute",
                height: bodyH * 0.74 * hero.height,
                left: "50%",
                top: 40 + hero.y,
                transform: `translateX(calc(-50% + ${hero.x}px))`,
                ...(hero.fade ? { maskImage: "linear-gradient(180deg, #000 78%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, #000 78%, transparent 100%)" } : {}),
              }}
            />
          </div>
        ) : (
          <Initials b={star} size={140} />
        )}
        {/* lower fade so the name sits on near-black */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bodyH * 0.42, background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,.85) 45%, #000 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", color: "#fff" }}>
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
              marginBottom: 14,
            }}
          >
            {chip ?? `TODAY · ${shortDate(date)}`}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: Math.min(112, Math.floor((LEFT_W - 40) / (0.48 * star.first.length))), lineHeight: 0.92, letterSpacing: 1, textShadow: "0 4px 18px rgba(0,0,0,.7)" }}>
            {star.first.toUpperCase()}
          </div>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: "#e6ecff", marginTop: 8 }}>{star.last.toUpperCase()}</div>
          <div style={{ marginTop: 16 }}>
            <Stars n={heroStars} size={34} />
          </div>
        </div>
      </div>

      {/* line-up */}
      <div style={{ position: "absolute", left: rightX, top: bodyTop, width: rightW, height: bodyH }}>
        <div style={{ height: LINEUP_HEAD, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 25, letterSpacing: 6, color: "#fff", whiteSpace: "nowrap" }}>THE ELITE LINE-UP</div>
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
          {lineup.map((b) => (
            <Tile key={b.id} b={b} date={date} w={grid.tw} h={grid.th} />
          ))}
          {Array.from({ length: openSlots }).map((_, i) => (
            <OpenSlot key={`open-${i}`} w={grid.tw} h={grid.th} />
          ))}
        </div>
        {/* totals */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
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
            <div style={{ fontFamily: DISPLAY, fontSize: 52, lineHeight: 1 }}>{everyone.length}</div>
            <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#c9d6ff" }}>ELITE BUILDERS</div>
          </div>
          <div style={{ width: 1, height: 64, background: "rgba(246,200,69,.5)" }} />
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 52, lineHeight: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              {totalDirects}
              <Stars n={1} size={30} />
            </div>
            <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#c9d6ff" }}>TOTAL DIRECTS</div>
          </div>
          <div style={{ width: 1, height: 64, background: "rgba(246,200,69,.5)" }} />
          <div style={{ fontFamily: LABEL, fontWeight: 700, fontSize: 20, letterSpacing: 2, lineHeight: 1.25 }}>
            REFER A PARTNER
            <br />
            <GoldText>YOU&apos;RE NEXT</GoldText>
          </div>
        </div>
      </div>

      {/* footer */}
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
