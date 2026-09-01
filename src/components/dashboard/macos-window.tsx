import { cn } from "@/lib/utils";

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
        <h2 className="macos-title">{title}</h2>
      </header>
      {toolbar}
      <div className={cn("macos-body", bodyClassName)}>{children}</div>
    </section>
  );
}
