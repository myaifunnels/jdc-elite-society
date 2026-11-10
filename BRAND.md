# JDC Elite Society — Brand Guidelines (v1, initial)

> Initial identity, derived from the master logo. A full rebrand is planned; keep everything token-driven so it can be re-themed.
> Hex values are estimated from the logo artwork — confirm against the original source file before print use.

## 1. Brand essence

**JDC Elite Society** is Coach JDC's premium coaching and mastermind membership (coachjdc.org). The identity should feel **powerful, polished and exclusive**: forged metal, deep royal blue, motion and momentum.

- **Personality:** confident, aspirational, disciplined, exclusive-but-welcoming
- **Voice:** direct and warm; premium, never salesy or hypey; plain words over jargon
- **Keywords:** elite, forged, momentum, society, leadership

## 2. Logo

Assets in `public/brand/`:

| File | Use |
|---|---|
| `jdc-elite-society-logo-horizontal.png` | Headers, banners, email, wide spaces |
| `jdc-elite-society-logo-stacked.webp` | Square placements, social avatars, covers, posters |

**Anatomy**
1. **JDC** — heavy, italic, extended wordmark in cobalt blue with chrome bevel and black outline. Conveys speed and forward motion.
2. **ELITE** — beveled chrome serif capitals (Trajan/Cinzel-like proportions).
3. **SOCIETY** — widely tracked chrome serif capitals flanked by two tapered rules.

**Rules**
- Use the full logo lockup; never retype the logo in a font.
- Clear space on all sides: at least the height of the "I" in ELITE.
- Minimum size: horizontal 160 px wide, stacked 96 px wide (digital).
- Preferred on **white or very light** backgrounds. On dark backgrounds, place the logo on a white or light-silver plate, or use a flat one-color version (to be produced) rather than the glossy art directly.
- Don't stretch, rotate, recolor, add shadows or glows, crop, or rearrange the three parts.
- Below minimum size, use "JDC" alone only once a standalone mark is approved.

## 3. Color

### Core palette
| Role | Name | Hex (est.) | Use |
|---|---|---|---|
| Primary | Cobalt Royal | `#0A24C8` | Brand blue, primary buttons, key accents |
| Primary bright | Electric Cobalt | `#1F4BFF` | Hover, highlights, links on light |
| Primary deep | Midnight Cobalt | `#06126B` | Pressed states, deep gradients |
| Metal light | Chrome | `#E6EAF2` | Light surfaces, bevel highlights |
| Metal mid | Steel | `#A9B1C2` | Borders, secondary text on dark |
| Metal dark | Gunmetal | `#3A4152` | Body text on light, icon strokes |
| Ink | Black Outline | `#0B0E17` | Headlines on light, dark surfaces |
| Canvas | White | `#FFFFFF` | Logo background, light pages |

### Website (dark UI) tokens — current in `src/app/elite/elite.css`
Background `#02040a`, raised `#070b16`, text `#f5f7ff`, body `#b6bfd1`, muted `#7d879d`. Accent blues `#1769ff`, `#57a5ff`, `#8fc8ff`, highlight `#77ddff`.
**To reconcile in the rebrand pass:** align the site's accent blues to Cobalt Royal / Electric Cobalt above, and pick a single primary (site currently has both `#1769ff` and `#2962ff`).

### Status
Success `#60d89d` · Error `#ff7c87` (on dark); darken for light backgrounds to keep 4.5:1 contrast.

### Usage ratio
~60% neutral (white/chrome or near-black), ~30% cobalt, ~10% chrome/metal accents. Use gradients only blue-to-deeper-blue or chrome-to-steel, mimicking the logo's metallic sheen.

## 4. Typography

**Helvetica Neue** is the brand typeface (replaces Playfair Display).

- **Headlines:** Helvetica Neue Bold / Heavy, tight tracking (-1% to -2%), optional italic for emphasis nodding to the JDC wordmark
- **Subheads:** Helvetica Neue Medium
- **Body:** Helvetica Neue Regular, 16–18 px web, 1.5–1.6 line height
- **Labels / eyebrows:** Helvetica Neue Medium, uppercase, wide tracking (+12% to +20%) — echoes "SOCIETY" in the logo
- **Fallback stack:** `"Helvetica Neue", Helvetica, Arial, sans-serif`
- Licensing note: Helvetica Neue is a commercial font. Without a webfont license it renders only on Apple devices; others fall back to Arial.

## 5. Visual language

- **Metallic bevel:** thin chrome edges, subtle inner highlights; use sparingly on cards and dividers.
- **Glass-card component** (`glass-card` in `elite.css`): translucent navy surface, soft blue edge glow, 28 px radius.
- **Tapered rules:** the lines beside SOCIETY can inspire section dividers (thin, tapered ends).
- **Angle & motion:** the italic slant of JDC suggests forward motion; use slight slants and directional reveals rather than bounce.
- **Imagery:** real coaching moments, confident portraits, high contrast, cool blue grade; avoid generic stock.
- **Motion:** ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; restrained and quick.

## 6. Voice & copy

- Address the reader as "you"; speak as a coach, not a seller.
- Short sentences, concrete outcomes, no unsubstantiated claims ("guaranteed", "#1").
- Title Case for the brand: **JDC Elite Society**. Never "JDC ELITE SOCIETY" in running text or "JDCES".
- CTA examples: "Apply to join", "Reserve your seat", "Join the Society".

## 7. Open items (rebrand next month)
- [ ] Confirm exact brand hex values from the source artwork
- [ ] Produce transparent-background, one-color (white and black) and icon-only logo variants
- [ ] Decide Helvetica Neue licensing (system stack vs. self-hosted webfont)
- [ ] Apply new tokens and font to `globals.css` / `elite.css`
