"use client";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { PriceMath, TickUtil } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";

interface PriceRangeProps {
  currentPrice: string;
  tickSpacing: number;
  minTick: number;
  maxTick: number;
  onMinTickChange: (tick: number) => void;
  onMaxTickChange: (tick: number) => void;
}

const USDC_DECIMALS = 6;
const SOL_DECIMALS = 9;

export default function PriceRange({
  currentPrice,
  tickSpacing,
  minTick,
  maxTick,
  onMinTickChange,
  onMaxTickChange,
}: PriceRangeProps) {
  // Store raw price values for calculations
  const minPriceRaw = PriceMath.tickIndexToPrice(
    minTick,
    SOL_DECIMALS,
    USDC_DECIMALS
  );

  console.log("PriceRange calculations:", {
    minTick,
    SOL_DECIMALS,
    USDC_DECIMALS,
    minPriceRaw: minPriceRaw.toString(),
  });
  const maxPriceRaw = PriceMath.tickIndexToPrice(
    maxTick,
    SOL_DECIMALS,
    USDC_DECIMALS
  );

  // Formatted prices for display
  const minPriceFormatted = minPriceRaw.toFixed(8);
  const maxPriceFormatted = maxPriceRaw.toFixed(8);

  const currentPriceNum = parseFloat(currentPrice);

  // Calculate percentage difference from current price
  const minPercent = (
    ((minPriceRaw.toNumber() - currentPriceNum) / currentPriceNum) *
    100
  ).toFixed(2);
  const maxPercent = (
    ((maxPriceRaw.toNumber() - currentPriceNum) / currentPriceNum) *
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
        SOL_DECIMALS,
        USDC_DECIMALS,
        tickSpacing
      ),
      tickSpacing
    );
    // Prevent minTick from exceeding maxTick
    if (tick <= maxTick) onMinTickChange(tick);
  };

  const handleMaxPriceInput = (value: string) => {
    const tick = TickUtil.getInitializableTickIndex(
      PriceMath.priceToInitializableTickIndex(
        new Decimal(value),
        SOL_DECIMALS,
        USDC_DECIMALS,
        tickSpacing
      ),
      tickSpacing
    );
    // Prevent maxTick from being less than minTick
    if (tick >= minTick) onMaxTickChange(tick);
  };

  // Reset to initial range
  const handleReset = () => {
    const initialMinTick = TickUtil.getInitializableTickIndex(
      PriceMath.priceToInitializableTickIndex(
        new Decimal(currentPriceNum * 0.9),
        SOL_DECIMALS,
        USDC_DECIMALS,
        tickSpacing
      ),
      tickSpacing
    );
    const initialMaxTick = TickUtil.getInitializableTickIndex(
      PriceMath.priceToInitializableTickIndex(
        new Decimal(currentPriceNum * 1.1),
        SOL_DECIMALS,
        USDC_DECIMALS,
        tickSpacing
      ),
      tickSpacing
    );
    onMinTickChange(initialMinTick);
    onMaxTickChange(initialMaxTick);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: 3 }}>
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
              onClick={() => onMinTickChange(adjustTick(minTick, false))}
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
              value={minPriceFormatted}
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
              onClick={() => onMinTickChange(adjustTick(minTick, true))}
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

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
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
              onClick={() => onMaxTickChange(adjustTick(maxTick, false))}
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
              value={maxPriceFormatted}
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
              onClick={() => onMaxTickChange(adjustTick(maxTick, true))}
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
