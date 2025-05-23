"use client";

// react
import { ReactNode } from "react";

// theme
// TODO: Add palette and typography here as necessary
import breakpoints from "@/theme/breakpoints";
import shadows from "@/theme/shadows";

// @mui
import { CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeOptions, ThemeProvider, createTheme } from "@mui/material/styles";

interface IHawksightThemeProvider {
  children: ReactNode;
}

export const getTheme = () => {
  const themeOptions: ThemeOptions = {
    breakpoints: breakpoints,
    shadows: shadows,
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
          disableTouchRipple: true,
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
    },
  };

  const theme = createTheme(themeOptions);

  return theme;
};

export const HawksightThemeProvider = ({
  children,
}: IHawksightThemeProvider) => {
  const hawksightTheme = getTheme();

  return (
    <AppRouterCacheProvider options={{ key: "css" }}>
      <ThemeProvider theme={hawksightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

export default HawksightThemeProvider;
