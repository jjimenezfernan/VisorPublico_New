// Componente para la barra superior de la aplicación.

import { Box, useTheme } from "@mui/material";
import { tokens } from "../data/theme";
import emsv_color_imagen_institucional from "../assets/emsv_color_imagen_institucional.png";
import getafe_institucional from "../assets/getafe_institucional.png";

function UpBar() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems={"center"}
      paddingX={2}
      height={"60px"}
      sx={{
        backgroundColor: colors.primary[100],
        borderBottom: 1,
        borderColor: colors.gray[800],
      }}
    >
      <a
        href="https://emsvgetafe.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={emsv_color_imagen_institucional}
          alt="Empresa municipal del suelo y la vivienda de Getafe"
          height={"40px"}
        />
      </a>
      <Box marginTop={1.5}>
        <a 
          href="https://getafe.es/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={getafe_institucional}
            alt="Ayuntamiento de Getafe"
            height={"27px"}
          />
        </a>
      </Box>
    </Box>
  );
}

export default UpBar;
