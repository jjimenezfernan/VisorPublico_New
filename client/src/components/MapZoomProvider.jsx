/*
Contexto para el zoom del mapa de la emsv y así evitar que se renderize mas el mapa al cambiar el zoom
*/

import { createContext, useContext, useState } from "react";

const MapZoomContext = createContext();

const MapZoomProvider = ({ children }) => {

  const [zoom, setZoom] = useState(false);

  const updateZoom = (newZoom) => {
    setZoom(newZoom);
  }

  return (
    <MapZoomContext.Provider
      value={{zoom, updateZoom}}
    >
      {children}
    </MapZoomContext.Provider>
  );
};

// Hook personalizado para consumir el contexto
export const useMapZoomContext = () => {
  const context = useContext(MapZoomContext);
  if (!context) {
    throw new Error("useMapZoomContext debe usarse dentro de un MapZoomProvider");
  }
  return context;
};

export default MapZoomProvider;
