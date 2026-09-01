export type DesignSystemSettings = {
  brand: string;
  brandDark: string;
  lightBackground: string;
  darkBackground: string;
  lightSurface: string;
  darkSurface: string;
  lightGlow: string;
  darkGlow: string;
};

export const defaultDesignSystem: DesignSystemSettings = {
  brand: "#2962ff",
  brandDark: "#0d36d9",
  lightBackground: "#e8eeff",
  darkBackground: "#04102a",
  lightSurface: "#f4f7fb",
  darkSurface: "#0c1c4a",
  lightGlow: "#9bbcff",
  darkGlow: "#2962ff",
};

export const designSystemStorageKey = "coach-jdc-design-system-v5";

export function getDesignSystemCssVariables(settings: DesignSystemSettings) {
  return {
    "--custom-brand": settings.brand,
    "--custom-brand-dark": settings.brandDark,
    "--custom-light-background": settings.lightBackground,
    "--custom-dark-background": settings.darkBackground,
    "--custom-light-surface": settings.lightSurface,
    "--custom-dark-surface": settings.darkSurface,
    "--custom-light-glow": settings.lightGlow,
    "--custom-dark-glow": settings.darkGlow,
  };
}
