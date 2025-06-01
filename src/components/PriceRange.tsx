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
  minTick: number;
  maxTick: number;
  onMinTickChange: (tick: number) => void;
  onMaxTickChange: (tick: number) => void;
  tokenDecimalsA: number;
  tokenDecimalsB: number;
}

const PriceRangeComponent = ({
  currentPrice,
  tickSpacing,
  minTick,
  maxTick,
  onMinTickChange,
  onMaxTickChange,
  tokenDecimalsA,
  tokenDecimalsB,
}: PriceRangeProps) => {
  const [localMinPriceInput, setLocalMinPriceInput] = useState<string>("");
  const [localMaxPriceInput, setLocalMaxPriceInput] = useState<string>("");

  const currentPriceNum = useMemo(
    () => parseFloat(currentPrice),
    [currentPrice]
  );

  useEffect(() => {
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

      if (localMinPriceInput !== parentMinPrice) {
        setLocalMinPriceInput(parentMinPrice);
      }
      if (localMaxPriceInput !== parentMaxPrice) {
        setLocalMaxPriceInput(parentMaxPrice);
      }
    } else {
      if (localMinPriceInput !== "") setLocalMinPriceInput("");
      if (localMaxPriceInput !== "") setLocalMaxPriceInput("");
    }
  }, [minTick, maxTick, tokenDecimalsA, tokenDecimalsB]);

  const minPriceRaw = useMemo(() => {
    if (minTick === 0 && tokenDecimalsA === undefined) return new Decimal(0);
    return PriceMath.tickIndexToPrice(minTick, tokenDecimalsA, tokenDecimalsB);
  }, [minTick, tokenDecimalsA, tokenDecimalsB]);

  const maxPriceRaw = useMemo(() => {
    if (maxTick === 0 && tokenDecimalsA === undefined) return new Decimal(0);
    return PriceMath.tickIndexToPrice(maxTick, tokenDecimalsA, tokenDecimalsB);
  }, [maxTick, tokenDecimalsA, tokenDecimalsB]);

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

  const adjustTick = useCallback(
    (tick: number, increment: boolean) =>
      increment
        ? TickUtil.getNextInitializableTickIndex(tick, tickSpacing)
        : TickUtil.getPrevInitializableTickIndex(tick, tickSpacing),
    [tickSpacing]
  );

  const handleMinPriceInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMinPriceInput(value);
    },
    []
  );

  const handleMaxPriceInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMaxPriceInput(value);
    },
    []
  );

  const handleMinPriceKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const parsedValue = new Decimal(localMinPriceInput || "0");
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
            if (newTick <= maxTick || maxTick === 0) {
              onMinTickChange(newTick);
            }
          } catch (error) {
            console.error("Error converting min price input to tick:", error);
          }
        }
      }
    },
    [
      localMinPriceInput,
      onMinTickChange,
      maxTick,
      tokenDecimalsA,
      tokenDecimalsB,
      tickSpacing,
    ]
  );

  const handleMaxPriceKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const parsedValue = new Decimal(localMaxPriceInput || "0");
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
            if (newTick >= minTick || minTick === 0) {
              onMaxTickChange(newTick);
            }
          } catch (error) {
            console.error("Error converting max price input to tick:", error);
          }
        }
      }
    },
    [
      localMaxPriceInput,
      onMaxTickChange,
      minTick,
      tokenDecimalsA,
      tokenDecimalsB,
      tickSpacing,
    ]
  );

  const handleReset = useCallback(() => {
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
              value={localMinPriceInput}
              onChange={handleMinPriceInput}
              onKeyPress={handleMinPriceKeyPress}
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
              value={localMaxPriceInput}
              onChange={handleMaxPriceInput}
              onKeyPress={handleMaxPriceKeyPress}
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
