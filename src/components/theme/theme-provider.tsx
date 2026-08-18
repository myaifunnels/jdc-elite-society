"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { DesignSystemProvider } from "@/components/theme/design-system-provider";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DesignSystemProvider>{children}</DesignSystemProvider>
    </NextThemesProvider>
  );
}
