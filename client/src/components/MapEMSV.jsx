/*
  Este componente es el encargado de renderizar el mapa de las zonas EPIU de Getafe, además de poner leyenda si es necesario
*/

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
  useMapEvent,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMapEMSVContext } from "./MapEMSVProvider";
import { useMapZoomContext } from "./MapZoomProvider";
import { useTypeSelectContext } from "./MapTypeSelectProvider";
import {typeOfSelections, selectColor} from "../data/legend_constants";
import MapLegendEMSV from "./MapLegendEMSV";
/*
MAPA DE ZONAS EPIU
*/

const styleLayer = {
  start: {
    fillColor: "#5498a9",
    stroke: true,
    color: "#42899b",
    weight: 0.3,
    opacity: 1,
    fillOpacity: 0.7,
  },
  default: {
    stroke: true,
    weight: 0.7,
    opacity: 1,
    fillOpacity: 0.7,
  },
  highlight: {
    stroke: true,
    weight: 0.7,
    opacity: 1,
    fillOpacity: 0.9,
  },
  selected: {
    fillColor: "#ec3c3c",
    stroke: true,
    color: "#ec3c3c",
    weight: 0.3,
    opacity: 1,
    fillOpacity: 0.7,
  },
};

// Cambiar y poner el de getafe
const VIEW_EMSV = [40.3122, -3.73];

function MapEmsv({ mapRef, geojsonLimites, geoEmsvParcelaConVivienda, geoEmsvParcelaSinVivienda }) {  
  const viewPoint = VIEW_EMSV;
  const zoom_default  = 15;

  const { reference, updatePropertiesLayerSelected, updateReferenceAndCalleNum } = useMapEMSVContext();

  const {typeSelect} = useTypeSelectContext();

  const { zoom, updateZoom } = useMapZoomContext();

  // Función que se ejecuta cuando se hace sobre un tipo de selección cambiando los colores de gradiente dependiendo del tipo de selección
  function colorLayerTypeSelect(layerProperties) {
    if (layerProperties[`${typeSelect}`] === null) {
      return {
        fillColor: "#a5a5a5",
        stroke: true,
        color: "#a5a5a5",
        weight: 0.3,
        opacity: 1,
        fillOpacity: 0.7,
      };
    }
    const key = selectColor(typeSelect,layerProperties[`${typeSelect}`]);
    return {
      fillColor: typeOfSelections[`${typeSelect}`].legend.gradient[key],
      stroke: true,
      color:  typeOfSelections[`${typeSelect}`].legend.gradient[key],
      weight: 0.3,
      opacity: 1,
      fillOpacity: 0.7,
    };
  }

  // Esto es de leaflet (define el comportamiento para cada una de las características (features) del GeoJSON)
  function onEachFeature(feature, layer, map) {
    
    // Si hay un tipo de selección, cambia el color de la capa dependiendo del valor de la capa seleccionada
    if (typeSelect) {
      layer.setStyle(colorLayerTypeSelect(feature.properties));
    }

    // Comprueba si la referencia catastral de la capa es igual a la referencia catastral seleccionada, y cambiar color y estilos,
    // además de actualizar las propiedades de la capa seleccionada y hacemos zoom
    // Siempre se resaltara la capa que ha sido buscada, aunque haya un a selección de tipo
    if (feature.properties.ref_catastral === reference) {
      //Actulalizar el estilo de la capa seleccionada
      layer.setStyle(styleLayer.selected);
      // Actualizar las propiedades de la capa seleccionada
      updatePropertiesLayerSelected(feature.properties);
      // Obtener las coordenadas del polígono
      if ( zoom === true ) {
        const coordinates = feature.geometry.coordinates[0][0][0];
        const [lng, lat] = coordinates; // Ajusta el orden según el formato de tus datos
        // Cambia el centro y el zoom del mapa
        map.setView([lat, lng], 17.25);
        updateZoom(false);
      }
    }

    layer.on({
      click: (e) => {
        // Solo actualiza CDID si es diferente al actua
        if (feature.properties.ref_catastral !== reference) {
          // Actualizar la referencia catastral y el número y calle se ponen nulos para no poder imprimir un pdf
          updateReferenceAndCalleNum(feature.properties.ref_catastral, ""); 
          updatePropertiesLayerSelected(feature.properties);
        }

      },
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }

  // Resalta la capa cuando se pasa el ratón por encima
  function highlightFeature(e) {
    let layer = e.target;
    layer.setStyle(styleLayer.highlight);
  }

  // Resetea el estilo de la capa cuando se deja de pasar el ratón por encima
  function resetHighlight(e) {
    let layer = e.target;
    layer.setStyle(styleLayer.default);
  }

  // Estilo de los polígonos
  function mapStyleEMSV(feature) {
    return {
      fillColor: "#b8a0a0",
      fillOpacity: 0.7,
      color: "#b8a0a0",
      weight: 0.3,
    };
  }
  
  // Estilo de los límites de los barrios
  function mapStyleLimites(feature) {
    return {
      color: "#000",
      weight: "2",
      dashArray: "4, 4",
      opacity: "0.5",
      fillOpacity: 0.0,
    };
  }

  // Estilo de los límites de los barrios
  function mapStyleEmsvParcelaSinVivienda(feature) {
    return {
      fillColor: "#a5a5a5",
      stroke: true,
      color: "#a5a5a5",
      weight: 0.3,
      opacity: 1,
      fillOpacity: 0.7,
    };
  }

  // Componente que renderiza el GeoJSON dinámicamente
  function DynamicGeoJSON({
    geojsonData,
    onEachFeature,
    mapStyle,
  }) {

    const map = useMap(); // Accede al mapa actual con el hook useMap
    // Use useMemo to conditionally render the GeoJSON component when selectionValue changes
    const geoJSONComponent = useMemo(() => {
      return (
        <GeoJSON
          data={geojsonData}
          onEachFeature={(feature, layer) => onEachFeature(feature, layer, map)}
          style={mapStyle}
        />
      );
    }, [reference, typeSelect]);

    return geoJSONComponent;
  }

  return (
    <MapContainer
      center={viewPoint}
      zoom={zoom_default}
      ref={mapRef}
      style={{ 
        height: "100%", 
        width: "100%", 
        borderRadius: "10px",
      }}
      zoomControl={false}
    >
      <TileLayer
        attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
        url="https://api.maptiler.com/maps/basic-v2-light/256/{z}/{x}/{y}.png?key=BLmB8erci1WE7XYWuf5R"
      />
      <ZoomControl position="bottomright" />
      <DynamicGeoJSON
        geojsonData={geoEmsvParcelaConVivienda.features}
        onEachFeature={onEachFeature}
        mapStyle={mapStyleEMSV}
      />
      <GeoJSON data={geojsonLimites.features} style={mapStyleLimites} />
      <GeoJSON data={geoEmsvParcelaSinVivienda.features} style={mapStyleEmsvParcelaSinVivienda} />
      {
        // Al rederizarse el mapa comprobora si debe renderizar la leyenda o no
        typeSelect
        ? <MapLegendEMSV position="bottomleft" typeSelect={typeSelect}/>
        : <></>
      }
    </MapContainer>
  );
}

export default MapEmsv;
