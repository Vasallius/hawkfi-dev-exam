"use client";
import { Box, Typography } from "@mui/material";

interface CurrentPoolPriceProps {
  price: string;
}

export default function CurrentPoolPrice({ price }: CurrentPoolPriceProps) {
  return (
    <Box sx={{ textAlign: "center", mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "0.1px",
          }}
        >
          -- CURRENT POOL PRICE
        </Typography>
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 500,
            color: "white",
          }}
        >
          {price} USDC per SOL
        </Typography>
      </Box>
    </Box>
  );
}
