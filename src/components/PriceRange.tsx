"use client";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { PriceMath, TickUtil } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
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
  tickSpacing: number;
}

const USDC_DECIMALS = 6;
const SOL_DECIMALS = 9;

export default function PriceRange({
  currentPrice,
  histogramData,
  histogramLoading,
  tickSpacing,
}: PriceRangeProps) {
  const [rangeType, setRangeType] = useState<"customRange" | "fullRange">(
    "customRange"
  );

  // Initial ticks based on ±10% from current price
  const currentPriceNum = parseFloat(currentPrice);
  const initialMinTick = TickUtil.getInitializableTickIndex(
    PriceMath.priceToInitializableTickIndex(
      new Decimal(currentPriceNum * 0.9),
      USDC_DECIMALS,
      SOL_DECIMALS,
      tickSpacing
    ),
    tickSpacing
  );
  const initialMaxTick = TickUtil.getInitializableTickIndex(
    PriceMath.priceToInitializableTickIndex(
      new Decimal(currentPriceNum * 1.1),
      USDC_DECIMALS,
      SOL_DECIMALS,
      tickSpacing
    ),
    tickSpacing
  );

  const [minTick, setMinTick] = useState(initialMinTick);
  const [maxTick, setMaxTick] = useState(initialMaxTick);

  // Convert ticks to price for display
  const minPrice = PriceMath.tickIndexToPrice(
    minTick,
    USDC_DECIMALS,
    SOL_DECIMALS
  ).toFixed(8);
  const maxPrice = PriceMath.tickIndexToPrice(
    maxTick,
    USDC_DECIMALS,
    SOL_DECIMALS
  ).toFixed(8);

  // Calculate percentage difference from current price
  const minPercent = (
    ((parseFloat(minPrice) - currentPriceNum) / currentPriceNum) *
    100
  ).toFixed(2);
  const maxPercent = (
    ((parseFloat(maxPrice) - currentPriceNum) / currentPriceNum) *
    100
  ).toFixed(2);

  // Handle increment/decrement
  const adjustTick = (tick: number, increment: boolean) =>
    increment
      ? TickUtil.getNextInitializableTickIndex(tick, tickSpacing)
      : TickUtil.getPrevInitializableTickIndex(tick, tickSpacing);

  // Handle user input for price fields
  const handleMinPriceInput = (value: string) => {
    const tick = TickUtil.getInitializableTickIndex(
      PriceMath.priceToInitializableTickIndex(
        new Decimal(value),
        USDC_DECIMALS,
        SOL_DECIMALS,
        tickSpacing
      ),
      tickSpacing
    );
    // Prevent minTick from exceeding maxTick
    if (tick <= maxTick) setMinTick(tick);
  };
  const handleMaxPriceInput = (value: string) => {
    const tick = TickUtil.getInitializableTickIndex(
      PriceMath.priceToInitializableTickIndex(
        new Decimal(value),
        USDC_DECIMALS,
        SOL_DECIMALS,
        tickSpacing
      ),
      tickSpacing
    );
    // Prevent maxTick from being less than minTick
    if (tick >= minTick) setMaxTick(tick);
  };

  // Reset to initial range
  const handleReset = () => {
    setMinTick(initialMinTick);
    setMaxTick(initialMaxTick);
  };

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
                color: "#dc92fc",
                fontSize: "14px",
                letterSpacing: "0.1px",
              }}
            >
              MINIMUM PRICE
            </Typography>
            <Typography sx={{ color: "#FF5C5C", fontSize: "14px" }}>
              {minPercent}%
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              bgcolor: "white",
              p: 1,
              borderRadius: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setMinTick(adjustTick(minTick, false))}
              sx={{
                p: 0,
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#8B948F"
                viewBox="0 0 256 256"
              >
                <path d="M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm56,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
              </svg>
            </IconButton>
            <TextField
              fullWidth
              value={minPrice}
              onChange={(e) => handleMinPriceInput(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "16px",
                  textAlign: "center",
                  p: 1,
                },
              }}
              sx={{
                "& input": {
                  color: "black",
                },
              }}
            />
            <IconButton
              size="small"
              onClick={() => setMinTick(adjustTick(minTick, true))}
              sx={{
                p: 0,
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#8B948F"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path>
              </svg>
            </IconButton>
          </Box>
        </Box>

        {rangeType === "customRange" && (
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography
                sx={{
                  color: "#dc92fc",
                  fontSize: "14px",
                  letterSpacing: "0.1px",
                }}
              >
                MAXIMUM PRICE
              </Typography>
              <Typography sx={{ color: "#46EB80", fontSize: "14px" }}>
                {maxPercent}%
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                bgcolor: "white",
                p: 1,
                borderRadius: 2,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setMaxTick(adjustTick(maxTick, false))}
                sx={{
                  p: 0,
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="#8B948F"
                  viewBox="0 0 256 256"
                >
                  <path d="M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm56,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
              </IconButton>
              <TextField
                fullWidth
                value={maxPrice}
                onChange={(e) => handleMaxPriceInput(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: "16px",
                    textAlign: "center",
                    p: 1,
                  },
                }}
                sx={{
                  "& input": {
                    color: "black",
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={() => setMaxTick(adjustTick(maxTick, true))}
                sx={{
                  p: 0,
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="#8B948F"
                  viewBox="0 0 256 256"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path>
                </svg>
              </IconButton>
            </Box>
          </Box>
        )}
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
          onClick={handleReset}
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
