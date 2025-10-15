/*
Contexto para saber que seleccion del mapa queremos
*/

import { createContext, useContext, useState } from "react";

// contexto para el mapa de EPIU
// Context to manage the state of the map
// Tener en cuanta que si este se actualiza, se van a redenrizar todos los componentes que depende de este
const MapTypeSelectContext = createContext();

// Proveedor del contexto del mapa de EPIU
// Ademas se definen las funciones para actualizar infovalue y selectionvalue
const MapTypeSelectProvider = ({ children }) => {
  
  // Tipo de la capa seleccionada
  const [typeSelect, setTypeSelect] = useState(null);

  const updateTypeSelect = (typeSelected) => {
    setTypeSelect(typeSelected);
  }

  return (
    <MapTypeSelectContext.Provider
      value={{ typeSelect, updateTypeSelect}}
    >
      {children}
    </MapTypeSelectContext.Provider>
  );
};

// Hook personalizado para consumir el contexto
export const useTypeSelectContext = () => {
  const context = useContext(MapTypeSelectContext);
  if (!context) {
    throw new Error("useTypeSelect debe usarse dentro de un MapTypeSelectProvider");
  }
  return context;
};

export default MapTypeSelectProvider;
