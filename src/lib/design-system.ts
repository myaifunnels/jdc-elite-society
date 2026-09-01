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
  brand: "#007bff",
  brandDark: "#0022aa",
  lightBackground: "#e8eef6",
  darkBackground: "#05070c",
  lightSurface: "#f4f7fb",
  darkSurface: "#10151f",
  lightGlow: "#c8d8ff",
  darkGlow: "#0055ff",
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
