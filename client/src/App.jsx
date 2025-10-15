/*
Fichero que se encarga de la gestión de las rutas de la aplicación y carga de los componentes principales.
*/

import { useState } from "react";
import { ColorModeContext, useMode } from "./data/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route, useLocation } from "react-router-dom";
import VisorEMSV from "./pages/VisorEMSV";
import UpBar from "./global_components/UpBar";
import Footer from "./global_components/Footer";
import SideBar from "./global_components/SideBar";
import MapEMSVProvider from "./components/MapEMSVProvider";
import MapZoomProvider from "./components/MapZoomProvider";
import MapTypeSelectProvider from "./components/MapTypeSelectProvider";
import Overlay from "./global_components/Overlay";
import { AnimatePresence } from "framer-motion";
import MapasExtra from "./pages/newMaps";

function App() {
  const [theme, colorMode] = useMode();
  const location = useLocation();
  const [showOverlay, setShowOverlay] = useState(true); // Initially show overlay

  const closeOverlay = () => {
    setShowOverlay(false);
  };

  // Check if the user is on the home page ("/") and showOverlay is true
  const shouldShowOverlay = showOverlay && location.pathname === "/";

  return (
    <AnimatePresence>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            {shouldShowOverlay && <Overlay closeOverlay={closeOverlay} />}
            <SideBar />
            <main className="content">
              <UpBar /> {/* <Bottom bar acts as topbar now /> */}
              <div className="map_footer"> {/* <div> tag added to fix footer position */}
                <Routes location={location} key={location.pathname}>
                  <Route
                    path="/"
                    element={
                      <MapEMSVProvider>
                        <MapZoomProvider>
                          <MapTypeSelectProvider>
                            <VisorEMSV />
                          </MapTypeSelectProvider>
                        </MapZoomProvider>
                      </MapEMSVProvider>
                    }
                  />
                  <Route
                      path="/mapas"
                      element={
                        <MapEMSVProvider>
                          <MapZoomProvider>
                            <MapTypeSelectProvider>
                              <MapasExtra />
                            </MapTypeSelectProvider>
                          </MapZoomProvider>
                        </MapEMSVProvider>
                      }
                    />
                </Routes>
                <Footer />
              </div>
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AnimatePresence>
  );
}

export default App;
