/*
  Contexto para el mapa de la emsv 
*/

import { createContext, useContext, useState } from "react";

// contexto para el mapa de EPIU
// Context to manage the state of the map
// Tener en cuanta que si este se actualiza, se van a redenrizar todos los componentes que depende de este
const MapEMSVContext = createContext();

// Proveedor del contexto del mapa de EPIU
// Ademas se definen las funciones para actualizar infovalue y selectionvalue
const MapEMSVProvider = ({ children }) => {

  // Referencia de la calle que se va a buscar desde SearchEngineGeneratorPDFEPIU
  const [reference, setReference] = useState("");
  const [calleNum, setCalleNum] = useState("");
  // Propiedades de la capa seleccionada
  const [propertiesLayerSelecet, setPropertiesLayerSelected] = useState({});

  const updateReferenceAndCalleNum = (newReference, newCalleNum) => {
    setReference(newReference);
    setCalleNum(newCalleNum);
  }

  const updatePropertiesLayerSelected = (newPropertiesLayerSelecet) => {
    setPropertiesLayerSelected(newPropertiesLayerSelecet);
  }

  return (
    <MapEMSVContext.Provider
      value={{ calleNum, reference, updateReferenceAndCalleNum, propertiesLayerSelecet, updatePropertiesLayerSelected}}
    >
      {children}
    </MapEMSVContext.Provider>
  );
};

// Hook personalizado para consumir el contexto
export const useMapEMSVContext = () => {
  const context = useContext(MapEMSVContext);
  if (!context) {
    throw new Error("useMapEMSVContext debe usarse dentro de un MapEMSVProvider");
  }
  return context;
};

export default MapEMSVProvider;
