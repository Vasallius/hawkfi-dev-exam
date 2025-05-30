"use client";
import { Box, Typography } from "@mui/material";

export default function PriceRangeHeader() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "white",
          }}
        />
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.1px",
            color: "white",
          }}
        >
          PRICE RANGE
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          height: "1px",
          bgcolor: "rgba(255, 255, 255, 0.12)",
          ml: 2,
        }}
      />
    </Box>
  );
}
