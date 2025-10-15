/* 
  Index de la página del visor 
*/

import { useState, useRef, useLayoutEffect } from "react";
import { Box, Typography, useTheme, Link, AppBar, Toolbar } from "@mui/material";
import { tokens } from "../../data/theme";
import axios from "axios";
import { motion } from "framer-motion";
import SubUpBar from "../../global_components/SubUpBar";
import MapEmsv from "../../components/MapEMSV";
import { useMapEMSVContext } from "../../components/MapEMSVProvider";
import { useTypeSelectContext } from "../../components/MapTypeSelectProvider";
import { useMapZoomContext } from "../../components/MapZoomProvider";
import { mapEmsvKeys } from "../../utils/auxUtils";
import SearchEngineGeneratorPDF from "../../components/SearchEngineGeneratorPDF";
import {DIRECTION} from "../../data/direccion_server";


// Panel Datos catastrales
const keysPanelDatosCatastrasles = [
  "calle_num",
  "ref_catastral",
  "tipologia_edificio",
  "uso_principal",
  "ano_constru",
  "ite",
  "barrio",
];

// Panel Datos Energéticos
const keysPanelDatosEnergeticos = [
  "demanda_calefaccion",
  "cert_emision_co2",
  "cert_consumo_e_primaria",
  "prod_fotovol",
  "irradiacion_anual_kwh/m2",
];

// Panel Datos Geograficos para la Convocatoria
const keysPanelDatosGeograficosConvocatoria = [
  "conj_homo",
  "especif_conj_homo",
  "ARRU",
  "ERRP",
  "CDDISTRITO",
];

// Array con aquellos keys de los paneles que pueden ser selecionados
const availableSelectionsEmsv = [
  "ano_constru",
  "cert_emision_co2",
  "conj_homo",
  "CDDISTRITO",
  "prod_fotovol",
  "ARRU",
  "ERRP",
  "especif_conj_homo",
];

// URL para la peticion de axios
const baseURL_emsv = DIRECTION + "/api/visor_emsv";

function VisorEMSV() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [geoLimitesEmsv, setLimitesEmsv] = useState({});
  const [geoEmsvParcelaSinVivienda, setEmsvParcelaSinVivienda] = useState({});
  const [geoEmsvParcelaConVivienda, setEmsvParcelaConVivienda] = useState({});
  const [jsonEmsvCalleNumReference, setJsonEmsvCalleNumReference] = useState({});
  
  // Contexto para saber las propiedades de la capa pulsada o buscada 
  const { propertiesLayerSelecet, calleNum } = useMapEMSVContext();
  
  const { typeSelect, updateTypeSelect } = useTypeSelectContext();

  const { updateZoom } = useMapZoomContext();

  // Renferencia del mapa
  const mapRef = useRef();

  // uselayouteffect se ejecuta antes de que se pinte el componente pero después de que se haya renderizado
  useLayoutEffect(() => {

    // info de los geojson y creacion de los mapas para buscar calle y numero y referencia catastral
    axios.get(baseURL_emsv).then((res) => {
      const geo_json_emsv_limites = res.data.geo_limites_getafe_emsv;
      const json_emsv_calle_num_reference = res.data.json_emsv_calle_num_reference;
      const geo_emsv_parcela_con_vivienda = res.data.geo_emsv_parcela_con_vivienda;
      const geo_emsv_parcela_sin_vivienda = res.data.geo_emsv_parcela_sin_vivienda;
      setLimitesEmsv(geo_json_emsv_limites);
      setJsonEmsvCalleNumReference(json_emsv_calle_num_reference);
      setEmsvParcelaConVivienda(geo_emsv_parcela_con_vivienda);
      setEmsvParcelaSinVivienda(geo_emsv_parcela_sin_vivienda);
      console.log("Created by Khora Urban Thinkers");
      console.log("Contact with us in https://khoraurbanthinkers.es")
      console.log("Our X account https://x.com/khoraurban")
      console.log("Our Linkedin account https://www.linkedin.com/company/khora-urban-thinkers/posts/?feedView=all")
    });
  }, []);

function searchBox (){
  if (Object.keys(geoEmsvParcelaConVivienda).length > 0) {
    return (
      <SearchEngineGeneratorPDF 
      json_calle_num_reference={jsonEmsvCalleNumReference}
      />
    )
  }
  return (
    (
      <AppBar position="static" color="default" sx={{ borderRadius: '8px', overflow: 'hidden' }} >
        <Toolbar sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Typography variant="h5" color={colors.gray[100]}>
            Cargando...
          </Typography>
        </Toolbar>
      </AppBar>
    )
  )
}


  // Funcion que se encarga de mostrar el mapa de EMSV o un mensaje de cargando si hay que rederizar algo
  function mapaEmsv () {
    if (Object.keys(geoEmsvParcelaConVivienda).length > 0) {
      return (
        <MapEmsv
          mapRef={mapRef}
          geojsonLimites={geoLimitesEmsv}
          geoEmsvParcelaConVivienda={geoEmsvParcelaConVivienda}
          geoEmsvParcelaSinVivienda={geoEmsvParcelaSinVivienda}
        />
      )
    }
    return (
      (
        <Typography variant="h5" color={colors.gray[100]}>
          Cargando...
          </Typography>
      )
    )
  }

  // Funcion que se ejecuta al hacer click en un link de los paneles de la derecha
  function handleSelectionClick(key) {
    // Para evitar que aquellos que no esta en availableSelectionsEmsv se puedan seleccionar
    // Es un parche para evitar que se pueda seleccionar cualquier key, pero esto se tendría que hacer en el componente solo
    if (availableSelectionsEmsv.includes(key)) {
      setTimeout(() => {
        updateTypeSelect(key);
        updateZoom(false);
      }, 100);
    }
    return;
  }

  // Funcion que pone el texto a los indicadores de la derecha del visor, además de el valor que eston tengan dependiendo de la capa seleccionada
  function infoTextDefault(nPanel) {
    let data = [];
    switch (nPanel) {
      case 11:
        data = keysPanelDatosCatastrasles;
        break;
      case 12:
        data = keysPanelDatosEnergeticos;
        break;
      case 13:
        data = keysPanelDatosGeograficosConvocatoria;
        break;
      default:
        data = [];
    }
    // Por cada key del panel se crea un div con el nombre de la key y el valor que tenga en el contexto
    return data.map((key) => {
      return (
        <div
          key={key}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 0.3rem 0 0.3rem",
            borderRadius: "5px",
            background: typeSelect === key ? colors.gray[800] : "",
          }}
        >
          <Link
            onClick={() => handleSelectionClick(key)} // Funcion que se ejecuta al hacer click en el link (no esta implementada pusto que no se ha necesitado)
            underline={availableSelectionsEmsv.includes(key) ? "hover" : "none"}
            sx={{
              cursor: availableSelectionsEmsv.includes(key) ? "pointer" : "text",
              ":hover": { color: colors.gray[600] },
            }}
          >
            <Typography
              variant={"h7"}
              color={colors.gray[100]}
              style={{ flex: 1, textAlign: "left" }}
            >
               {mapEmsvKeys.get(key)}
            </Typography>
          </Link>
          <Typography
            variant={"h7"}
            color={colors.gray[100]}
            fontWeight={700}
            style={{ flex: 1, textAlign: "right" }}
          >
            {propertiesLayerSelecet[key] ? propertiesLayerSelecet[key] : (key === "calle_num" && calleNum ? calleNum : "-")} 
            {/* Si la propiedad no esta definida y se pone un guion, en caso de ser calle_num al no venir en el geojson la tenemos que sacar 
            del contexto y ver que la key sea calle_num además de que calleNum exista para poder poner la calle y el número */}
          </Typography>
        </div>
      );
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <SubUpBar
        title={"Visor de Datos Públicos de Vivienda"}
        crumbs={[
          ["Inicio", "/"],
          ["Visor EPIU", "/visor-epiu"],
        ]}
        info={{
          title: "Visor de Datos Públicos de Vivienda",
          description: (<Typography></Typography>
          ),
        }}
      />
      <Box m="10px">
        <Box
          display={"grid"}
          gridTemplateColumns={"repeat(12,1fr)"}
          //60 topbar + 40 SubUpBar + 20 gaps + 10 extra
          gridAutoRows={`calc((100vh - 60px - 40px - 20px - 10px) / 8.8)`}
          gap={"10px"}
        >
          {/* Mapa  EMSV*/}
          <Box
            gridColumn={"span 8"}
            gridRow={"span 8"}
            backgroundColor={colors.gray[900]}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-evenly"}
            flexDirection={"column"}
            borderRadius={'10px'}
          >
            {mapaEmsv()}
          </Box>
          <Box
            gridColumn={"span 4"}
            gridRow={"span 2"}
            backgroundColor={colors.gray[900]}
            display={"flex"}
            alignItems={"stretch"}
            justifyContent={"space-evenly"}
            py={"5px"}
            px={"1rem"}
            flexDirection={"column"}
            borderRadius={'10px'}
          >
            <Typography
              variant={"h6"}
              color={"#fff"}
              fontWeight={600}
              px={"0.3rem"}
              sx={{ background: colors.blueAccent[400], borderRadius: "5px" }}
            >
              Buscador de Direcciones
            </Typography>
              {searchBox()}
          </Box>
          <Box
            gridColumn={"span 4"}
            gridRow={"span 2"}
            backgroundColor={colors.gray[900]}
            display={"flex"}
            alignItems={"stretch"}
            justifyContent={"space-evenly"}
            py={"5px"}
            px={"1rem"}
            flexDirection={"column"}
            borderRadius={'10px'}
          >
            <Typography
              variant={"h6"}
              color={"#fff"}
              fontWeight={600}
              px={"0.3rem"}
              sx={{ background: colors.blueAccent[400], borderRadius: "5px" }}
            >
              Datos Catastrales
            </Typography>
            {infoTextDefault(11)}
          </Box>
          <Box
            gridColumn={"span 4"}
            gridRow={"span 2"}
            backgroundColor={colors.gray[900]}
            display={"flex"}
            alignItems={"stretch"}
            justifyContent={"space-evenly"}
            py={"5px"}
            px={"1rem"}
            flexDirection={"column"}
            borderRadius={'10px'}
          >
            <Typography
              variant={"h6"}
              color={"#fff"}
              fontWeight={600}
              px={"0.3rem"}
              sx={{ background: colors.blueAccent[400], borderRadius: "5px" }}
            >
              Datos Energeticos
            </Typography>
            {infoTextDefault(12)}
          </Box>
          <Box
            gridColumn={"span 4"}
            gridRow={"span 2"}
            backgroundColor={colors.gray[900]}
            display={"flex"}
            alignItems={"stretch"}
            justifyContent={"space-evenly"}
            py={"5px"}
            px={"1rem"}
            flexDirection={"column"}
            borderRadius={'10px'}
          >
            <Typography
              variant={"h6"}
              color={"#fff"}
              fontWeight={600}
              px={"0.3rem"}
              sx={{ background: colors.blueAccent[400], borderRadius: "5px" }}
            >
              Datos Geograficos para la Convocatoria
            </Typography>
            {infoTextDefault(13)}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

export default VisorEMSV;
