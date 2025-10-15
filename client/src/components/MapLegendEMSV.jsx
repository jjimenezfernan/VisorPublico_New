/**
 * Archivo que carga las distintas leyendas
 * TODO habría que generalizar las leyendas
 */

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/system";
import { tokens } from "../data/theme";
import { typeOfSelections } from "../data/legend_constants";

// Classes used by Leaflet to position controls
const POSITION_CLASSES = {
  bottomleft: "leaflet-bottom leaflet-left",
  bottomright: "leaflet-bottom leaflet-right",
  topleft: "leaflet-top leaflet-left",
  topright: "leaflet-top leaflet-right",
};

function MapLegendEMSV({ position, typeSelect}) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // typeSelect siempre tendra valor puesto que este componente solo se renderiza si se ha pulsado en alguna seleccion
  const legendValues = typeOfSelections[typeSelect].legend.values;
  const legendGradient = typeOfSelections[typeSelect].legend.gradient;

  const positionClass =
    (position && POSITION_CLASSES[position]) || POSITION_CLASSES.topright;

  // añade un valor para que el rango de las leyendas sea de N a N-1 y de esa forma no tener rangos que se solapen
  function addOneUnit(prev, value) {
    let result = parseFloat(prev) + parseFloat(value);
    if (result % 1 !== 0) {
      // If it has decimals, round it to two decimal places
      return parseFloat(result.toFixed(2));
    } else {
      // If it's an integer, return it as is
      return result;
    }
  }

  function renderLegendCert(values, gradient, lastItem) {
    const legendItems = gradient.map((value, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        p={1}
        sx={{ "&:not(:last-child)": { marginBottom: -2 } }}
      >
        <Box width={16} height={16} marginRight={1} backgroundColor={value} />
        <Typography variant="body1">{values[index]}</Typography>
      </Box>
    ));

    // Add the last gray item with a value of 0
    legendItems.push(
      <Box key="lastItem" display="flex" alignItems="center" p={1}>
        <Box width={16} height={16} marginRight={1} backgroundColor="#bababa" />
        <Typography variant="body1">{lastItem}</Typography>
      </Box>
    );

    return legendItems;
  }

  function renderLegendAnyoConstru(values, gradient, lastItem) {
    const legendItems = gradient.map((value, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        p={1}
        sx={{ "&:not(:last-child)": { marginBottom: -2 } }}
      >
        <Box width={16} height={16} marginRight={1} backgroundColor={value} />
        {/* if it's the first, render +N */}
        {/* if it's the rest, render in values in pairs, subtracting 1 from the first value */}
        <Typography variant="body1">
          {index === 0
            ? "+ " + values[index]
            : index === values.length - 1
            ? "Anterior a " + values[index-1]
            : values[index - 1] + " - " + addOneUnit(values[index], 1)}
        </Typography>
      </Box>
    ));

    // Add the last gray item with a value of 0
    legendItems.push(
      <Box key="lastItem" display="flex" alignItems="center" p={1}>
        <Box width={16} height={16} marginRight={1} backgroundColor="#bababa" />
        <Typography variant="body1">{lastItem}</Typography>
      </Box>
    );

    return legendItems;
  }

  // En este tipo de leyenda lastitem ya esta en el array de valores
  function renderLegendSiNo(values, gradient ) {
    const legendItems = gradient.map((value, index) => (
        <Box
          key={index}
          display="flex"
          alignItems="center"
          p={1}
          sx={{ "&:not(:last-child)": { marginBottom: -2 } }}
        >
          <Box
            width={16}
            height={16}
            marginRight={1}
            backgroundColor={value}
          />
          <Typography variant="body1">{values[index]}</Typography>
        </Box>
    ));

    return legendItems;
  }

  function renderCdDistrito(values, gradient, lastItem) {
    const legendItems = gradient.map((value, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        p={1}
        sx={{ "&:not(:last-child)": { marginBottom: -2 } }}
      >
        <Box width={16} height={16} marginRight={1} backgroundColor={value} />
        <Typography variant="body1">{values[index]}</Typography>
      </Box>
    ));

    // Add the last gray item with a value of 0
    legendItems.push(
      <Box key="lastItem" display="flex" alignItems="center" p={1}>
        <Box width={16} height={16} marginRight={1} backgroundColor="#bababa" />
        <Typography variant="body1">{lastItem}</Typography>
      </Box>
    );

    return legendItems;
  }

  function renderProdFotovol(values, gradient, lastItem) {
    const legendItems = gradient.map((value, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        p={1}
        sx={{ "&:not(:last-child)": { marginBottom: -2 } }}
      >
        <Box width={16} height={16} marginRight={1} backgroundColor={value} />
        {/* if it's the first, render +N */}
        {/* if it's the rest, render in values in pairs, subtracting 1 from the first value */}
        <Typography variant="body1">
          {index === 0
            ? "+ " + values[index]
            : index === values.length - 1
            ? "Anterior a " + values[index-1]
            : values[index - 1] + " - " + addOneUnit(values[index], 1)}
        </Typography>
      </Box>
    ));

    // Add the last gray item with a value of 0
    legendItems.push(
      <Box key="lastItem" display="flex" alignItems="center" p={1}>
        <Box width={16} height={16} marginRight={1} backgroundColor="#bababa" />
        <Typography variant="body1">{lastItem}</Typography>
      </Box>
    );

    return legendItems;
  }

  function renderEspecifConjHomo(values, gradient, lastItem) {
    const legendItems = gradient.map((value, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        p={1}
        sx={{ "&:not(:last-child)": { marginBottom: -2 } }}
      >
        <Box width={16} height={16} marginRight={1} backgroundColor={value} />
        <Typography variant="body1">{values[index]}</Typography>
      </Box>
    ));

    // Add the last gray item with a value of 0
    legendItems.push(
      <Box key="lastItem" display="flex" alignItems="center" p={1}>
        <Box width={16} height={16} marginRight={1} backgroundColor="#bababa" />
        <Typography variant="body1">{lastItem}</Typography>
      </Box>
    );

    return legendItems;
  }

  function renderLegend() {
    if (typeSelect === "ano_constru") {
      return renderLegendAnyoConstru(legendValues, legendGradient, "ND");
    }
    else if (typeSelect === "cert_emision_co2") {
      return renderLegendCert(legendValues, legendGradient, "ND");
    }
    else if (typeSelect === "conj_homo") {
      return renderLegendSiNo(legendValues, legendGradient);
    }
    else if (typeSelect === "CDDISTRITO") {
      return renderCdDistrito(legendValues, legendGradient, "ND");
    }
    else if (typeSelect === "prod_fotovol") {
      return renderProdFotovol(legendValues, legendGradient, "ND");
    }
    else if (typeSelect === "ARRU") {
      return renderLegendSiNo(legendValues, legendGradient);
    }
    else if (typeSelect === "ERRP") {
      return renderLegendSiNo(legendValues, legendGradient);
    }
    else if (typeSelect === "especif_conj_homo") {
      return renderEspecifConjHomo(legendValues, legendGradient, "ND");
    }
  }
  // Si se ha pulsado en alguna selecion se pone leyenda en el mapa
  return (
    // <Box ref={divRef} className={positionClass}>
    <Box className={positionClass}>
      <Box className="leaflet-control leaflet-bar">
        <Box
          height={"auto"}
          maxHeight={"60vh"}
          maxWidth={"20vw"}
          backgroundColor={alpha(colors.primary[100], 0.95)}
          display={"flex"}
          flexDirection={"column"}
          overflow={"auto"}
          py={"5px"}
          px={"10px"}
        >
          <Typography
            variant={"h6"}
            color={colors.blueAccent[400]}
            fontWeight={600}
            ml={"0.45rem"}
          >
            Leyenda
          </Typography>
          {renderLegend(legendValues, legendGradient)}
        </Box>
      </Box>
    </Box>
  );
}

export default MapLegendEMSV;
