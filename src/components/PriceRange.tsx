// src/components/PriceRange.tsx
"use client";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { PriceMath, TickUtil } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

interface PriceRangeProps {
  currentPrice: string;
  tickSpacing: number;
  minTick: number; // The official, debounced minTick from parent
  maxTick: number; // The official, debounced maxTick from parent
  onMinTickChange: (tick: number) => void; // Parent's setMinTick
  onMaxTickChange: (tick: number) => void; // Parent's setMaxTick
  tokenDecimalsA: number; // NEW: Added for price conversions
  tokenDecimalsB: number; // NEW: Added for price conversions
}

// Named function component for memoization
const PriceRangeComponent = ({
  currentPrice,
  tickSpacing,
  minTick,
  maxTick,
  onMinTickChange,
  onMaxTickChange,
  tokenDecimalsA, // Use these props for conversions
  tokenDecimalsB, // Use these props for conversions
}: PriceRangeProps) => {
  // Use local state for the input fields, holding PRICE strings for display
  // This allows smooth typing without immediately affecting parent state or re-rendering everything
  const [localMinPriceInput, setLocalMinPriceInput] = useState<string>("");
  const [localMaxPriceInput, setLocalMaxPriceInput] = useState<string>("");

  // Use a memoized version of currentPriceNum to avoid re-parsing on every render
  const currentPriceNum = useMemo(
    () => parseFloat(currentPrice),
    [currentPrice]
  );

  // Effect to sync local input states with parent's minTick/maxTick props
  useEffect(() => {
    // Only update if parent ticks are valid (not 0, which is initial state)
    // and if decimals are known (from poolInfo)
    if (minTick !== 0 || maxTick !== 0) {
      const parentMinPrice = PriceMath.tickIndexToPrice(
        minTick,
        tokenDecimalsA,
        tokenDecimalsB
      ).toFixed(8);
      const parentMaxPrice = PriceMath.tickIndexToPrice(
        maxTick,
        tokenDecimalsA,
        tokenDecimalsB
      ).toFixed(8);

      // Only update local state if it's different from the parent's value
      // This prevents input field cursor jumping when typing rapidly
      if (localMinPriceInput !== parentMinPrice) {
        setLocalMinPriceInput(parentMinPrice);
      }
      if (localMaxPriceInput !== parentMaxPrice) {
        setLocalMaxPriceInput(parentMaxPrice);
      }
    } else {
      // Optionally clear fields or set a default if ticks are 0
      if (localMinPriceInput !== "") setLocalMinPriceInput("");
      if (localMaxPriceInput !== "") setLocalMaxPriceInput("");
    }
  }, [minTick, maxTick, tokenDecimalsA, tokenDecimalsB]); // Dependencies to re-run when ticks or decimals change

  // Derived formatted prices from current minTick/maxTick props
  // These are used for calculations like percentage
  const minPriceRaw = useMemo(() => {
    // Ensure we have valid decimals before trying to calculate price
    if (minTick === 0 && tokenDecimalsA === undefined) return new Decimal(0); // Fallback
    return PriceMath.tickIndexToPrice(minTick, tokenDecimalsA, tokenDecimalsB);
  }, [minTick, tokenDecimalsA, tokenDecimalsB]);

  const maxPriceRaw = useMemo(() => {
    if (maxTick === 0 && tokenDecimalsA === undefined) return new Decimal(0); // Fallback
    return PriceMath.tickIndexToPrice(maxTick, tokenDecimalsA, tokenDecimalsB);
  }, [maxTick, tokenDecimalsA, tokenDecimalsB]);

  // Calculate percentage difference from current price
  const minPercent = useMemo(() => {
    if (currentPriceNum === 0) return "0.00";
    return (
      ((minPriceRaw.toNumber() - currentPriceNum) / currentPriceNum) *
      100
    ).toFixed(2);
  }, [minPriceRaw, currentPriceNum]);

  const maxPercent = useMemo(() => {
    if (currentPriceNum === 0) return "0.00";
    return (
      ((maxPriceRaw.toNumber() - currentPriceNum) / currentPriceNum) *
      100
    ).toFixed(2);
  }, [maxPriceRaw, currentPriceNum]);

  // Handle increment/decrement
  const adjustTick = useCallback(
    (tick: number, increment: boolean) =>
      increment
        ? TickUtil.getNextInitializableTickIndex(tick, tickSpacing)
        : TickUtil.getPrevInitializableTickIndex(tick, tickSpacing),
    [tickSpacing]
  );

  // Handle user input for price fields
  const handleMinPriceInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMinPriceInput(value); // Update local state immediately

      const parsedValue = new Decimal(value || "0");
      if (
        !parsedValue.isNaN() &&
        tokenDecimalsA !== undefined &&
        tokenDecimalsB !== undefined
      ) {
        try {
          const newTick = PriceMath.priceToInitializableTickIndex(
            parsedValue,
            tokenDecimalsA,
            tokenDecimalsB,
            tickSpacing
          );
          // Only update parent if valid and does not exceed maxTick
          if (newTick <= maxTick || maxTick === 0) {
            // Allow setting if maxTick is still default 0
            onMinTickChange(newTick);
          }
        } catch (error) {
          console.error("Error converting min price input to tick:", error);
        }
      }
    },
    [onMinTickChange, maxTick, tokenDecimalsA, tokenDecimalsB, tickSpacing]
  );

  const handleMaxPriceInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMaxPriceInput(value); // Update local state immediately

      const parsedValue = new Decimal(value || "0");
      if (
        !parsedValue.isNaN() &&
        tokenDecimalsA !== undefined &&
        tokenDecimalsB !== undefined
      ) {
        try {
          const newTick = PriceMath.priceToInitializableTickIndex(
            parsedValue,
            tokenDecimalsA,
            tokenDecimalsB,
            tickSpacing
          );
          // Only update parent if valid and not less than minTick
          if (newTick >= minTick || minTick === 0) {
            // Allow setting if minTick is still default 0
            onMaxTickChange(newTick);
          }
        } catch (error) {
          console.error("Error converting max price input to tick:", error);
        }
      }
    },
    [onMaxTickChange, minTick, tokenDecimalsA, tokenDecimalsB, tickSpacing]
  );

  // Reset to initial range
  const handleReset = useCallback(() => {
    // Ensure currentPriceNum is valid before resetting
    if (isNaN(currentPriceNum) || currentPriceNum === 0) return;

    const initialMinPrice = new Decimal(currentPriceNum).mul(0.9);
    const initialMaxPrice = new Decimal(currentPriceNum).mul(1.1);

    const initialMinTick = PriceMath.priceToInitializableTickIndex(
      initialMinPrice,
      tokenDecimalsA,
      tokenDecimalsB,
      tickSpacing
    );
    const initialMaxTick = PriceMath.priceToInitializableTickIndex(
      initialMaxPrice,
      tokenDecimalsA,
      tokenDecimalsB,
      tickSpacing
    );
    onMinTickChange(initialMinTick);
    onMaxTickChange(initialMaxTick);
  }, [
    onMinTickChange,
    onMaxTickChange,
    currentPriceNum,
    tokenDecimalsA,
    tokenDecimalsB,
    tickSpacing,
  ]);

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
              value={localMinPriceInput} // Bind to local state
              onChange={handleMinPriceInput}
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
              value={localMaxPriceInput} // Bind to local state
              onChange={handleMaxPriceInput}
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
};

const MemoizedPriceRange = memo(PriceRangeComponent);
export default MemoizedPriceRange;
