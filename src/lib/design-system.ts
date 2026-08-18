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
  lightBackground: "#f4efe8",
  darkBackground: "#05070d",
  lightSurface: "#ffffff",
  darkSurface: "#0f1730",
  lightGlow: "#fff8ee",
  darkGlow: "#1a53ff",
};

export const designSystemStorageKey = "coach-jdc-design-system-v4";

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
