"use client";
import { Box } from "@mui/material";
import LiquidityPool from "../components/LiquidityPool";

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#070D0AE5",
        color: "white",
        p: 3,
      }}
    >
      <LiquidityPool />
    </Box>
  );
}
