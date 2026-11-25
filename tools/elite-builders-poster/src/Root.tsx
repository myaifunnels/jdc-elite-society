import { Still } from "remotion";
import { Poster } from "./Poster";
import { MonthPoster } from "./MonthPoster";
import { MONTH_POSTERS, PANEL_POSTERS, POSTERS, TOP_POSTERS } from "./roster";
import { PanelPoster } from "./PanelPoster";
import { TopPoster } from "./TopPoster";

export const Root = () => (
  <>
    {POSTERS.map((p) => (
      <Still key={p.id} id={p.id} component={Poster} width={1080} height={1350} defaultProps={{ date: p.date, builder: p.builder, chip: p.chip, spotlight: p.spotlight }} />
    ))}
    {MONTH_POSTERS.map((m) => (
      <Still key={m.id} id={m.id} component={MonthPoster} width={1080} height={1350} defaultProps={{ spec: m }} />
    ))}
    {TOP_POSTERS.map((m) => (
      <Still key={m.id} id={m.id} component={TopPoster} width={1080} height={1350} defaultProps={{ month: m.month }} />
    ))}
    {PANEL_POSTERS.map((m) => (
      <Still key={m.id} id={m.id} component={PanelPoster} width={1080} height={1350} defaultProps={{ spec: m }} />
    ))}
  </>
);
