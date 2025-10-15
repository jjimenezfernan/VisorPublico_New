/* Fichero que contiene el formulario de búsqueda de direcciones con autocompletado para el nombre de la calle y 
  un campo de texto para el número del portal.
  
  Este componente recibe un json con la estructura:
  {    "Avia M-50": {
        "15900": "000700200VK35H"
    },
    "Cmno del Canalizo": {
        "3": "001000100WK46C",
        "1": "1608102VK4611S",
        "5": "28065A02100010"
    },
  }
  */

import { useState, useEffect } from 'react';
import { TextField, Button, Autocomplete, Grid, AppBar, Toolbar, Box, Typography } from '@mui/material';
import { useMapEMSVContext } from "./MapEMSVProvider";
import { useMapZoomContext } from "./MapZoomProvider";
import { useTypeSelectContext } from "./MapTypeSelectProvider";

import axios from 'axios';
import {DIRECTION} from "../data/direccion_server";
const baseURL_emsv = DIRECTION + "/api/generate_pdf";

// Componente que representa el formulario de búsqueda de la dirección
function SearchEngineGeneratorPDF({ json_calle_num_reference }) {
  // Estado para almacenar los valores seleccionados
  const [selectedStreet, setSelectedStreet] = useState('');
  const [portalNumber, setPortalNumber] = useState('');

  // Contexto del mapa
  //TODO Para le PDF tendremos que añadir aqui coger la calle el numero y sus propiedades
  const { updateReferenceAndCalleNum, updatePropertiesLayerSelected, propertiesLayerSelecet, calleNum, reference, } = useMapEMSVContext();
  const { updateZoom } = useMapZoomContext();
  const { updateTypeSelect } = useTypeSelectContext();

  useEffect(() => {
    if (!calleNum) {
      setPortalNumber(''); // Limpiar el campo de número del portal
      setSelectedStreet(''); // Limpiar el campo de calle
    }
  }, [calleNum]);

  // Maneja el evento de cambio en el autocompletado de calles
  const handleStreetChange = (event, value) => {
    setSelectedStreet(value);
    setPortalNumber(''); // Limpiar el campo de número del portal
  };

  // Maneja el evento de cambio en el campo de número del portal
  const handlePortalNumberChange = (event, value) => {
    setPortalNumber(value);
  };

  // Función para manejar la búsqueda cuando se presiona el botón
  const handleSearch = () => {
    if (!selectedStreet || !portalNumber) {
      alert('Por favor, seleccione una calle y un número de portal');
      return
    }
    // Actualizar el estado de cargando, para que el mapa se cambie a cargando mientras se realiza la búsqueda
    setTimeout(() => {
      updateReferenceAndCalleNum(json_calle_num_reference[selectedStreet][portalNumber], `${selectedStreet} ${portalNumber}`);
      updateZoom(true);
    }, 100);
  };

  const handleReset = () => {
    // Actualizar el estado de cargando, para que el mapa se cambie a cargando mientras se realiza la búsqueda
    setTimeout(() => {
      updateTypeSelect(null);
      setPortalNumber(''); // Limpiar el campo de número del portal
      setSelectedStreet(''); // Limpiar el campo de calle
      updateReferenceAndCalleNum(null, null); // Limpiar la referencia y el número de calle
      updatePropertiesLayerSelected({}); // Limpiar las propiedades de la capa seleccionada
    }, 100);
  }

  const generarPDF = async () => {
    
    // Si no se ha buscado nada no se hace el pdf
    if (!calleNum || !reference) {
      alert('Por favor, busque una dirección antes de generar el PDF');
      return
    }

    // Datos que se enviarán al backend propertiesLayerSelecet
    const datos = {
        calle: selectedStreet,
        num: portalNumber,
        ref_catastral: propertiesLayerSelecet.ref_catastral,
        tipologia_edificio: propertiesLayerSelecet.tipologia_edificio,
        uso_principal: propertiesLayerSelecet.uso_principal,
        ano_constru: propertiesLayerSelecet.ano_constru,
        ite: propertiesLayerSelecet.ite,
        barrio: propertiesLayerSelecet.barrio,
        demanda_calefaccion: propertiesLayerSelecet.demanda_calefaccion,
        calificacion_demanda_calefaccion: propertiesLayerSelecet.calificacion_demanda_calefaccion,
        cert_emision_co2: propertiesLayerSelecet.cert_emision_co2,
        cert_consumo_e_primaria: propertiesLayerSelecet.cert_consumo_e_primaria,
        prod_fotovol: propertiesLayerSelecet.prod_fotovol,
        irradiacion_anual_kwh_m2: propertiesLayerSelecet.irradiacion_anual_kwh_m2,
        conj_homo: propertiesLayerSelecet.conj_homo,
        especif_conj_homo: propertiesLayerSelecet.especif_conj_homo,
        arru: propertiesLayerSelecet.ARRU,
        errp: propertiesLayerSelecet.ERRP,
        cddistrito: propertiesLayerSelecet.CDDISTRITO,
    };

    try {
        // Solicitar el PDF al backend
        const response = await axios.post(baseURL_emsv, datos, {
            responseType: 'blob', // Importante para manejar binarios
        });

        // Crear un enlace para descargar el PDF
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'datos_emsv_visor.pdf'); // Nombre del archivo
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error generando el PDF:', error);
    }
  };

  return (
    <AppBar position="static" color="default" sx={{ borderRadius: '8px', overflow: 'hidden' }} >
        <Toolbar >
          <Grid container spacing={2} alignItems="center">
          {/* Contenedor para la calle o avenida */}
          <Grid item xs={12} md={6}>
              <Autocomplete
                options={Object.keys(json_calle_num_reference) || []}
                getOptionLabel={(option) => option}
                onChange={handleStreetChange}
                renderInput={(params) => <TextField {...params} label="Calle/Avenida/Plaza" variant="outlined" />}
                value={selectedStreet}
                noOptionsText="No hay calles disponibles"
              />
          </Grid>

          {/* Contenedor para el número del portal */}
          <Grid item xs={12} md={3}>
              <Autocomplete
                options={ json_calle_num_reference[selectedStreet]
                          ? Object.keys(json_calle_num_reference[selectedStreet])
                          : []} // si no existe la calle, no mostrar opciones
                getOptionLabel={(option) => (option)}
                onChange={handlePortalNumberChange}
                renderInput={(params) => <TextField {...params} label="Número del Portal" variant="outlined" />}
                value={portalNumber}
                noOptionsText="Selecione Calle/Avenida/Plaza Primero"
              />
          </Grid>

          {/* Contenedor para el botón de búsqueda */}
          <Grid item xs={12} md={3}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSearch} 
                sx={{
                  fontSize: '15px', // Tamaño del texto
                  padding: '8px 8px', // Espaciado interno
                  minWidth: '107px', // Ancho mínimo
                }}
              >
                Buscar
              </Button>
          </Grid>
          </Grid>
      </Toolbar>
      {/* Botón centrado */}
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end'}}>
        {/* <Button variant="contained" color="primary" onClick={handleResetTypeSelection}>
          Restablecer selección de tipo
        </Button> */}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleReset}
          sx={{
            fontSize: '12px', // Tamaño del texto
            padding: '8px 8px', // Espaciado interno
            minWidth: '107px', // Ancho mínimo
            backgroundColor: '#bbbbbb', // Color de fondo
            '&:hover': {
              backgroundColor: '#8a8a8a', // Color al pasar el mouse
            },
          }}
        >
          Restablecer Datos
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={generarPDF}
          sx={{
            fontSize: '12px', // Tamaño del texto
            padding: '8px 8px', // Espaciado interno
            minWidth: '107px', // Ancho mínimo
            marginLeft: 1.8, // Margen derecho para separar del siguiente botón
            marginRight: 1, // Margen izquierdo para separar del siguiente botón
          }}
        >
          Descargar PDF
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default SearchEngineGeneratorPDF;
