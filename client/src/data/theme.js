import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        gray: {
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#c2c2c2",
          500: "#666666",
          600: "#525252",
          700: "#3d3d3d",
          800: "#292929",
          900: "#141414",
        },
        primary: {
          100: "#141b2d",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1F2A40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#040509",
        },
        greenAccent: {
          100: "#d7e6d8",
          200: "#b0cdb1",
          300: "#88b38b",
          400: "#619a64",
          500: "#39813d",
          600: "#2e6731",
          700: "#224d25",
          800: "#173418",
          900: "#0b1a0c",
        },
        redAccent: {
          100: "#f2d6d8",
          200: "#e5acb1",
          300: "#d7838b",
          400: "#ca5964",
          500: "#bd303d",
          600: "#972631",
          700: "#711d25",
          800: "#4c1318",
          900: "#260a0c",
        },
        blueAccent: {
          100: "#deebf6",
          200: "#bdd6ed",
          300: "#9cc2e5",
          400: "#7baddc",
          500: "#5a99d3",
          600: "#487aa9",
          700: "#365c7f",
          800: "#243d54",
          900: "#121f2a",
        },
        orangeAccent: {
          100: "#faecd9",
          200: "#f5d9b3",
          300: "#f1c68d",
          400: "#ecb367",
          500: "#e7a041",
          600: "#b98034",
          700: "#8b6027",
          800: "#5c401a",
          900: "#2e200d",
        },
      }
    : {
        //light mode
        gray: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#d1d1d1",
          900: "#f2f2f2",
        },
        primary: {
          100: "#faf9f9",
          200: "#f7f6f6",
          300: "#f5f3f3",
          400: "#f2f0f0",
          500: "#c2c0c0",
          600: "#919090",
          700: "#616060",
          800: "#303030",
          900: "#303030",
        },
        greenAccent: {
          100: "#0b1a0c",
          200: "#173418",
          300: "#224d25",
          400: "#2e6731",
          500: "#39813d",
          600: "#619a64",
          700: "#88b38b",
          800: "#b0cdb1",
          900: "#d7e6d8",
        },
        redAccent: {
          100: "#260a0c",
          200: "#4c1318",
          300: "#711d25",
          400: "#972631",
          500: "#bd303d",
          600: "#ca5964",
          700: "#d7838b",
          800: "#e5acb1",
          900: "#f2d6d8",
        },
        blueAccent: {
          100: "#121f2a",
          200: "#243d54",
          300: "#365c7f",
          400: "#487aa9",
          500: "#5a99d3",
          600: "#7baddc",
          700: "#9cc2e5",
          800: "#bdd6ed",
          900: "#deebf6",
        },
        orangeAccent: {
          100: "#2e200d",
          200: "#5c401a",
          300: "#8b6027",
          400: "#b98034",
          500: "#e7a041",
          600: "#ecb367",
          700: "#f1c68d",
          800: "#f5d9b3",
          900: "#faecd9",
        },
        purpleAccent: {
          100: "#f0d6f0",
          200: "#e1ade1",
          300: "#d383d3",
          400: "#c45ac4",
          500: "#b531b5",
          600: "#912791",
          700: "#6d1d6d",
          800: "#481448",
          900: "#240a24",
        },
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);

  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            primary: {
              main: colors.primary[500],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              main: colors.gray[500],
              dark: colors.gray[700],
              light: colors.gray[100],
            },
            background: {
              default: colors.primary[500],
            },
          }
        : {
            primary: {
              main: colors.primary[100],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              main: colors.gray[500],
              dark: colors.gray[700],
              light: colors.gray[100],
            },
            background: {
              default: "#fcfcfc",
            },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 18,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h7: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "0.85rem",
      },
      body1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "0.75rem",
      },
      body2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 10,
      },
      body3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 8,
      },
    },
  };
};

//context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};
