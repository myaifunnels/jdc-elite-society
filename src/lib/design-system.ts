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
  brand: "#c5a35a",
  brandDark: "#8d6b32",
  lightBackground: "#f4efe6",
  darkBackground: "#070707",
  lightSurface: "#fffcf7",
  darkSurface: "#161616",
  lightGlow: "#efe2c4",
  darkGlow: "#c5a35a",
};

export const designSystemStorageKey = "coach-jdc-design-system-v3";

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
