import { cn } from "@/lib/utils";

export function MacosTrafficLights() {
  return (
    <div className="macos-lights" aria-hidden>
      <span className="macos-light is-close" />
      <span className="macos-light is-min" />
      <span className="macos-light is-zoom" />
    </div>
  );
}

export function MacosWindow({
  title,
  toolbar,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("macos-window macos-app-window", className)}>
      <header className="macos-titlebar">
        <MacosTrafficLights />
        <h2 className="macos-title">{title}</h2>
        <span />
      </header>
      {toolbar}
      <div className={cn("macos-body", bodyClassName)}>{children}</div>
    </section>
  );
}
