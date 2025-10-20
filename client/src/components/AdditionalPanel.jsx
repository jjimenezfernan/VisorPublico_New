// AdditionalPanel.jsx
import { Box, Typography, Alert, CircularProgress, useTheme } from "@mui/material";
import { tokens } from "../data/theme";

export default function AdditionalPanel({ stats, loading, error }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        backgroundColor: "#f3f4f6",
        borderRadius: "10px",
        p: "0.5rem 1rem 0.75rem 1rem",
        width: "100%",
      }}
    >
      {/* Título pegado arriba */}
      <Typography
        variant="h6"
        color="#fff"
        fontWeight={600}
        sx={{
          background: colors.blueAccent[400],
          borderRadius: "6px",
          px: "0.6rem",
          py: "0.35rem",
          mb: 1,
          lineHeight: 1.2,
        }}
      >
        Indicador horas de sombra por edificio
      </Typography>

      {/* Tarjeta de contenido */}
      <Box
        sx={{
          background: "white",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          p: "10px 12px",
          fontSize: 13,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          Información sobre las sombras
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <span>Calculando…</span>
          </Box>
        )}

        {!!error && (
          <Alert severity="error" sx={{ py: 0, my: 0 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && stats && (
          <Box sx={{ lineHeight: 1.6 }}>
            <div>
              Media de horas de sombra: <b>{stats.avg != null ? stats.avg.toFixed(2) : "–"} h</b>
            </div>
            <div>
              Punto con menos horas: <b>{stats.min != null ? stats.min.toFixed(2) : "–"} h</b> ·
              Punto con más horas: <b>{stats.max != null ? stats.max.toFixed(2) : "–"} h</b>
            </div>
          </Box>
        )}

        {!loading && !error && !stats && (
          <Typography variant="body2" color="text.secondary">
            Busca un edificio para ver sus estadísticas aquí.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
