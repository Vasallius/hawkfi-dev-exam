"use client";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { HistogramBin } from "../types/pool";
import CurrentPoolPrice from "./CurrentPoolPrice";
import LiquidityChart from "./LiquidityChart";
import PriceRangeHeader from "./PriceRangeHeader";
import RangeToggle from "./RangeToggle";

interface PriceRangeProps {
  currentPrice: string;
  histogramData: HistogramBin[];
  histogramLoading: boolean;
}

export default function PriceRange({
  currentPrice,
  histogramData,
  histogramLoading,
}: PriceRangeProps) {
  const [rangeType, setRangeType] = useState<"customRange" | "fullRange">(
    "customRange"
  );
  const [minPrice, setMinPrice] = useState("143.02973025");
  const [maxPrice, setMaxPrice] = useState("174.76504829");

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: 3 }}>
      <PriceRangeHeader />

      <Box sx={{ mb: 3 }}>
        <RangeToggle value={rangeType} onChange={setRangeType} />
      </Box>

      <CurrentPoolPrice price={currentPrice} />

      {rangeType === "customRange" && (
        <Box sx={{ mb: 3 }}>
          <LiquidityChart
            histogramData={histogramData}
            isLoading={histogramLoading}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography
              sx={{
                color: "#BD61F5",
                fontSize: "14px",
                letterSpacing: "0.1px",
              }}
            >
              MINIMUM PRICE
            </Typography>
            <Typography sx={{ color: "#FF5C5C", fontSize: "14px" }}>
              -10.08%
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              bgcolor: "#1A1A1A",
              p: 1,
              borderRadius: 2,
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.04)",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
              fullWidth
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "16px",
                  color: "white",
                  textAlign: "center",
                },
              }}
            />
            <IconButton
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.04)",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography
              sx={{
                color: "#BD61F5",
                fontSize: "14px",
                letterSpacing: "0.1px",
              }}
            >
              MAXIMUM PRICE
            </Typography>
            <Typography sx={{ color: "#46EB80", fontSize: "14px" }}>
              +9.88%
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              bgcolor: "#1A1A1A",
              p: 1,
              borderRadius: 2,
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.04)",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
              fullWidth
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "16px",
                  color: "white",
                  textAlign: "center",
                },
              }}
            />
            <IconButton
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.04)",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#1A1A1A",
          p: 2,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ color: "white", fontSize: "14px" }}>
          USDC PER SOL
        </Typography>
        <Button
          variant="text"
          startIcon={<RefreshIcon />}
          onClick={() => {
            setMinPrice("143.02973025");
            setMaxPrice("174.76504829");
          }}
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "none",
            "&:hover": {
              color: "white",
              bgcolor: "rgba(255, 255, 255, 0.08)",
            },
          }}
        >
          Reset Price Range
        </Button>
      </Box>
    </Box>
  );
}
