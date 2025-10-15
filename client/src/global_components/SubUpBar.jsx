/* */

import React, { useState } from "react";
import {
  Box,
  useTheme,
  Typography,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { tokens } from "../data/theme";

function SubUpBar({ title, crumbs, info }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      display="flex"
      p={1}
      height={"auto"} // Ajustado para que la altura sea automática según el contenido
      sx={{
        borderBottom: 1,
        borderColor: '#f43653',//colors.redAccent[800],
        backgroundColor: '#f43653', //colors.redAccent[800],
      }}
    >
      {/* Sección de título e información */}
      <Box display="flex" flex={1} alignItems={"center"} justifyContent={"flex-start"}>
        <Box display="flex" flexDirection={"row"} alignItems={"center"}>
          <Typography
            variant="h4"
            fontStyle={"bold"}
            fontFamily={"rubik"}
            fontWeight={800}
            pl={"10px"}
            sx={{ color: colors.gray[900], marginRight: "10px" }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      <Box display="flex" flex={1} alignItems={"center"} justifyContent={"flex-end"} >
        <Typography
            variant="h4"
            fontStyle={"bold"}
            fontFamily={"rubik"}
            fontWeight={300}
            pl={"10px"}
            sx={{ color: colors.gray[900], marginRight: "10px" }}
          >
            {/* {"Actualizado: XX/XX/XXXX - XX:XXh"} */}
          </Typography>
      </Box>
    </Box>
  );
}

export default SubUpBar;
