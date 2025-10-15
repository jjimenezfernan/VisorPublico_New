// Código de footer 
// Destcar que se utilizo codigo y estilos de la página principal de la EMSV

import React from "react";
import { Box, Typography } from "@mui/material";
import footer_ay_getafe from "../assets/footer/footer_ay_getafe.png";
import footer_facebook from "../assets/footer/footer_facebook.svg";
import footer_x from "../assets/footer/footer_x.svg";
import footer_youtube from "../assets/footer/footer_youtube.svg";

function Footer() {
  return (
    <Box component="footer" sx={{ backgroundColor: "#333", color: "#fff", p: 3 }}>
      <Box
        className="footer-container"
        sx={{
            display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          maxWidth: "1200px",
          margin: "0 auto",
          gap: 2,
        }}
      >
        <Box className="footer-logo" sx={{ flex: "1 1 200px", display: "flex", flexDirection: "column", alignItems: "start" }}>
          <img src={footer_ay_getafe} alt="Logo Ayuntamiento de Getafe" style={{ width: "60px", marginBottom: "10px" }} />
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>GETAFE AYUNTAMIENTO</Typography>
        </Box>

        <Box className="footer-info" sx={{ display: "flex", flexWrap: "wrap", flex: "2 1 600px", gap: 2 }}>
          <Box className="footer-section" sx={{ flex: "1 1 150px" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>SEDE</Typography>
            <Typography variant="body2">Pl. Obispo-Felipe Scio, 2-1<br />28901, Getafe, Madrid</Typography>
            <a href="mailto:infovivienda@emsvgetafe.org" color="inherit">infovivienda@emsvgetafe.org</a>
          </Box>

          <Box className="footer-section" sx={{ flex: "1 1 150px" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>HORARIO</Typography>
            <Typography variant="body2">
              L a V de 9 a 14.30 h<br />L y X de 16:30 a 18:45
            </Typography>
            <Typography variant="body2">📞 91 601 90 99</Typography>
          </Box>

          <Box className="footer-section" sx={{ flex: "1 1 150px" }}>
            <ul className="footer-as" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li><a href="https://emsvgetafe.org/sobre-emsv/" color="inherit">Sobre EMSV</a></li>
              <li><a href="https://emsvgetafe.org/hogares/" color="inherit">Hogares</a></li>
              <li><a href="https://emsvgetafe.org/promociones/" color="inherit">Promociones</a></li>
              <li><a href="https://emsvgetafe.org/innovacion/" color="inherit">Innovación</a></li>
            </ul>
          </Box>

          <Box className="footer-section" sx={{ flex: "1 1 150px" }}>
            <ul className="footer-as" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li><a href="https://emsvgetafe.org/noticias/" color="inherit">Actualidad</a></li>
              <li><a href="https://emsvgetafe.org/contacto/" color="inherit">Contacto</a></li>
              <li className="sede-electronica"><a href="https://emsvgetafe.sedelectronica.es/" color="inherit" sx={{ border: "1px solid #fff", padding: "5px 10px", borderRadius: "3px", display: "inline-block" }}>SEDE ELECTRÓNICA</a></li>
            </ul>
          </Box>
        </Box>

        <Box className="footer-social" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <a href="https://www.facebook.com/emsvgetafe" aria-label="Facebook"><img src={footer_facebook} alt="Facebook" style={{ width: "24px", height: "24px" }} /></a>
          <a href="https://x.com/emsv_getafe" aria-label="X"><img src={footer_x} alt="X" style={{ width: "24px", height: "24px" }} /></a>
          <a href="https://www.youtube.com/channel/UCrn_zJExsUY6Zba_ScaB-yQ" aria-label="YouTube"><img src={footer_youtube} alt="YouTube" style={{ width: "24px", height: "24px" }} /></a>
        </Box>
      </Box>

      <Box className="footer-bottom" sx={{ display: "flex", justifyContent: "center", gap: 2, pt: 2, borderTop: "1px solid #555", fontSize: "12px" }}>
        <a href="https://emsvgetafe.org/politica-privacidad/" color="inherit">Política de privacidad</a>
        <a href="https://emsvgetafe.org/aviso-legal/" color="inherit">Aviso legal</a>
        <a href="https://emsvgetafe.org/cookies/" color="inherit">Cookies</a>
      </Box>
    </Box>
  );
}

export default Footer;