import { Still } from "remotion";
import { Poster } from "./Poster";
import { POSTERS } from "./roster";

export const Root = () => (
  <>
    {POSTERS.map((p) => (
      <Still key={p.id} id={p.id} component={Poster} width={1080} height={1350} defaultProps={{ date: p.date, builder: p.builder, chip: p.chip }} />
    ))}
  </>
);
