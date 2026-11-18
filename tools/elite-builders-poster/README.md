# Elite Builders poster

Daily "Elite Builders" poster for the JDC Elite Society FB Page and Community: 1080x1350 (4:5) PNG stills made with Remotion.
One star = 1 direct (a partner the builder referred).

## Make a new poster

1. Put the builder's photo through background removal (`pip install "rembg[cpu]"`, then
   `rembg i -m isnet-general-use photo.jpg public/builders/<id>.png`) and crop it to the person.
2. In `src/roster.ts`:
   - new builder: add them to `ROSTER` with their first direct date in `directs`;
   - existing builder with another direct: add the new date to their `directs` (stars always show the total so far).
   - add a line to `POSTERS`: `{ id: "2026-11-18-name", date: "2026-11-18", builder: "name" }`.
3. `npm install` once, then `npm run render` (or `npm run render -- <poster id>`). Output goes to `out/`.
   `npm run studio` opens a live preview for tuning.

The line-up shows everyone who had joined by the poster's day, newest first, and never anyone from a later day.
If a face in the line-up looks too big or small, tune that builder's `face` (`zoom`, `y`) in `roster.ts`.
Builders without a `photo` show their initials until a cutout is added.

## Design rules

Brand: JDC cobalt #2962ff, deep #0d36d9, near-black #010309, gold gradient #fff0b0 > #f6c845 > #b8860b.
Fonts: Anton (Impact-style, names and headline) and Barlow Condensed (labels), bundled in `public/fonts`.
Builder of the day on the left: cutout, no border, cinematic navy-to-black gradient with soft cobalt glow, sheen, vignette and grain;
studio light on the person (warm key, cool rim), never a blue glow on them. "TODAY · NOV xx" chip above the name, gold stars = directs.
Right side "THE ELITE LINE-UP": gold-framed tiles on black, date tag, name, gold divider, stars; the grid adds columns as it grows.
Open "+ YOUR NAME COULD BE HERE" slots fill the last row; totals block below. Effects never touch faces. Text stays high contrast.

## Caption format

Post title, then a caps headline with emoji, congratulate by FULL name, a short line on referring partners, the "⭐ = 1 direct" line,
CTA "Refer a partner today with your referral link.", and exactly 3 hashtags: #JDCEliteSociety #EliteBuilders #ReferAPartner
