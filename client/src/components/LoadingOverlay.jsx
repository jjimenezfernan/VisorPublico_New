// components/LoadingOverlay.jsx
import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingOverlay({ open = false, text = "Cargando..." }) {
  if (!open) return null;
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(17,24,39,0.55)", // gris oscuro translúcido
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,         // por encima del mapa dentro del Box
        pointerEvents: "none", // deja pasar clicks al mapa si te interesa
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
        <CircularProgress size={32} />
        <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700 }}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
}
