"use client";

import { useDesignSystem } from "@/components/theme/design-system-provider";
import { DesignSystemSettings } from "@/lib/design-system";

const fields: { key: keyof DesignSystemSettings; label: string }[] = [
  { key: "brand", label: "Primary brand" },
  { key: "brandDark", label: "Primary shadow" },
  { key: "lightBackground", label: "Light background" },
  { key: "darkBackground", label: "Dark background" },
  { key: "lightSurface", label: "Light glass surface" },
  { key: "darkSurface", label: "Dark glass surface" },
  { key: "lightGlow", label: "Light glow" },
  { key: "darkGlow", label: "Dark glow" },
];

export function DesignSystemPanel() {
  const { settings, updateSetting, resetSettings } = useDesignSystem();

  return (
    <section className="glass-panel rounded-[2rem] p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">Live design system</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Update the shared palette here and the public site plus dashboards inherit the same tokens immediately.
          </p>
        </div>

        <button
          type="button"
          onClick={resetSettings}
          className="button-secondary pressable rounded-full px-4 py-2 text-sm font-medium"
        >
          Reset palette
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-2 text-sm">
            <span className="font-medium">{field.label}</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3">
              <input
                type="color"
                value={settings[field.key]}
                onChange={(event) => updateSetting(field.key, event.target.value)}
                className="h-10 w-12 rounded-xl border border-[var(--line)] bg-transparent"
              />
              <code className="text-sm text-[var(--muted)]">{settings[field.key]}</code>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
