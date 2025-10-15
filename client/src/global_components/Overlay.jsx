// Componente que se muestra al cargar la página, con información sobre la aplicación y la empresa

import React from "react";
import { Button, Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../data/theme";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import emsv_color_imagen_institucional from "../assets/emsv_color_imagen_institucional.png";
import getafe_institucional from "../assets/getafe_institucional.png";

function Overlay({ closeOverlay }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box
      onClick={closeOverlay}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: colors.primary[200],
        zIndex: 9999,
      }}
    >
      <Button
        onClick={closeOverlay}
        disableRipple
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          height: "5rem",
          width: "5rem",
          backgroundColor: '#f43653',
          color: colors.gray[900],
          '&:hover': {
            backgroundColor: '#f43653', // para que no cambie el background al hacer hover
            color: colors.gray[800],
          },
          '&:active': {
            backgroundColor:  '#f43653', // para que no cambie el background al hacer hover
            color: colors.gray[600],
          },
        }}
      >
        <Typography 
          align="center" 
          fontSize={"7rem"} 
          sx={{ fontWeight: 'bold', fontFamily: 'Rubik', }}
        >
          ×
        </Typography>
      </Button>
      <Box 
        display={"flex"} 
        alignItems={"end"} 
        justifyContent={"center"}
        height={"50%"}
        width={"100%"}
        backgroundColor={'#f43653'}
      >
        <Box 
          width={"42rem"}
        >
          <Typography
            variant="h1"
            color={colors.gray[900]}
            fontWeight={400}
            paddingBottom={"1rem"}
            sx={{ fontWeight: 'bold' }}
          >
            Visor de datos publicos <br/>de edificación en Getafe
          </Typography>
          <Typography
            variant="h4"
            align="justify"
            paddingTop={"1rem"}
            width={"auto"}
            margin={"auto"}
            color={colors.gray[900]}
            paddingBottom={"1rem"}
          >
            La Empresa Municipal del Suelo y la Vivienda de Getafe recoge en este visor público datos a escala edificio para facilitar y mejorar la comunicación con vecinos y entidades del municipio.
          </Typography>
        </Box>
      </Box>
      <Box 
        display={"flex"} 
        justifyContent={"center"}
        height={"50%"}
        width={"100%"}
        backgroundColor={colors.gray[900]}
      >
        <Box 
          width={"42rem"}
        >
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
            paddingTop={"1.5rem"}
          >
            <img
              src={emsv_color_imagen_institucional}
              alt="Empresa municipal del suelo y la vivienda de Getafe"
              height={"50px"}
            />
            <img
              src={getafe_institucional}
              alt="Ayuntamiento de Getafe"
              height={"40px"}
            />
          </Box>
        </Box>
      </Box>
      <Box
        position={"absolute"}
        bottom={0}
        left={0}
        height={"7rem"}
        width={"100%"}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        justifyContent={"flex-end"}
        padding={"1rem"}
      >
        <Typography fontSize={"0.78rem"} align="left" color={colors.gray[500]}>
          Para su visualización óptima le recomendamos:
          <br />
          <strong>En portátiles:</strong> Reducir el zoom del navegador al{" "}
          <strong>80%</strong> <ZoomOutIcon />
          <br />
          <strong>En monitores:</strong> No es necesario realizar ningún ajuste
          de zoom.
        </Typography>
      </Box>
    </Box>
  );
}

export default Overlay;
