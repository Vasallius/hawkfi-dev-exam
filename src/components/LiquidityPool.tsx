// src/components/LiquidityPool.tsx
"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { PriceMath } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import { useEffect, useMemo, useState } from "react";

// Import the hooks
import { useLiquidityHistogram } from "../hooks/useLiquidityHistogram";
import { usePoolData } from "../hooks/usePoolData";

// Import other component parts
import CurrentPoolPrice from "./CurrentPoolPrice";
import LiquidityChart from "./LiquidityChart"; // LiquidityChart now contains the slider
import PriceRange from "./PriceRange";
import PriceRangeHeader from "./PriceRangeHeader";
import RangeToggle from "./RangeToggle";

export default function LiquidityPool() {
  const {
    poolInfo,
    ctx, // Get the context object here
    loading: poolLoading,
    error: poolError,
  } = usePoolData();

  const [rangeType, setRangeType] = useState<"customRange" | "fullRange">(
    "customRange"
  );

  // These are the main, official min/max ticks for the user's selected range.
  // They are updated by LiquidityChart's debounced handlers, or RangeInputSection.
  const [minTick, setMinTick] = useState<number>(0);
  const [maxTick, setMaxTick] = useState<number>(0);

  // Memoized current price in Decimal format
  const currentPriceDecimal = useMemo(() => {
    if (!poolInfo) return new Decimal(0);
    return new Decimal(poolInfo.currentPrice);
  }, [poolInfo]);

  // Effect to set initial minTick and maxTick when poolInfo becomes available
  useEffect(() => {
    if (poolInfo && !currentPriceDecimal.isZero()) {
      const initialMinPrice = currentPriceDecimal.mul(0.9);
      const initialMaxPrice = currentPriceDecimal.mul(1.1);

      const initialMinTick = PriceMath.priceToInitializableTickIndex(
        initialMinPrice,
        poolInfo.tokenA.decimals,
        poolInfo.tokenB.decimals,
        poolInfo.tickSpacing
      );
      const initialMaxTick = PriceMath.priceToInitializableTickIndex(
        initialMaxPrice,
        poolInfo.tokenA.decimals,
        poolInfo.tokenB.decimals,
        poolInfo.tickSpacing
      );

      setMinTick(initialMinTick);
      setMaxTick(initialMaxTick);
      console.log(
        "Initial user-controlled ticks set:",
        initialMinTick,
        initialMaxTick
      );
    }
  }, [poolInfo, currentPriceDecimal]);

  // === Derived values (from minTick/maxTick and poolInfo) ===

  const minPrice = useMemo(() => {
    if (!poolInfo) return new Decimal(0);
    return PriceMath.tickIndexToPrice(
      minTick,
      poolInfo.tokenA.decimals,
      poolInfo.tokenB.decimals
    );
  }, [minTick, poolInfo]);

  const maxPrice = useMemo(() => {
    if (!poolInfo) return new Decimal(0);
    return PriceMath.tickIndexToPrice(
      maxTick,
      poolInfo.tokenA.decimals,
      poolInfo.tokenB.decimals
    );
  }, [maxTick, poolInfo]);

  const minPricePercentage = useMemo(() => {
    if (!poolInfo || currentPriceDecimal.isZero()) return new Decimal(0);
    return minPrice.div(currentPriceDecimal);
  }, [minPrice, currentPriceDecimal, poolInfo]);

  const maxPricePercentage = useMemo(() => {
    if (!poolInfo || currentPriceDecimal.isZero()) return new Decimal(0);
    return maxPrice.div(currentPriceDecimal);
  }, [maxPrice, currentPriceDecimal, poolInfo]);

  const leftMostPrice = useMemo(() => {
    if (!poolInfo || currentPriceDecimal.isZero()) return new Decimal(0);
    return minPricePercentage.minus(0.1).times(currentPriceDecimal);
  }, [minPricePercentage, currentPriceDecimal, poolInfo]);

  const rightMostPrice = useMemo(() => {
    if (!poolInfo || currentPriceDecimal.isZero()) return new Decimal(0);
    return maxPricePercentage.plus(0.1).times(currentPriceDecimal);
  }, [maxPricePercentage, currentPriceDecimal, poolInfo]);

  const leftMostTick = useMemo(() => {
    if (!poolInfo) return 0;
    return PriceMath.priceToInitializableTickIndex(
      leftMostPrice,
      poolInfo.tokenA.decimals,
      poolInfo.tokenB.decimals,
      poolInfo.tickSpacing
    );
  }, [leftMostPrice, poolInfo]);

  const rightMostTick = useMemo(() => {
    if (!poolInfo) return 0;
    return PriceMath.priceToInitializableTickIndex(
      rightMostPrice,
      poolInfo.tokenA.decimals,
      poolInfo.tokenB.decimals,
      poolInfo.tickSpacing
    );
  }, [rightMostPrice, poolInfo]);

  // === Fetch histogram data using the hook ===
  const {
    histogramData,
    loading: histogramLoading,
    error: histogramError,
  } = useLiquidityHistogram({
    poolInfo,
    ctx, // Pass the context received from usePoolData
    chartMinTick: leftMostTick, // The absolute range for the chart to display
    chartMaxTick: rightMostTick,
    userMinTick: minTick, // The user's currently selected range (for marking active bins)
    userMaxTick: maxTick,
  });

  // Combine errors for display
  const combinedError = poolError || histogramError;

  // Debugging logs for derived ticks
  useEffect(() => {
    if (poolInfo) {
      console.log("Chart Display Range (Ticks):", leftMostTick, rightMostTick);
    }
  }, [leftMostTick, rightMostTick, poolInfo]);

  // === Conditional Render Blocking ===
  if (combinedError) {
    return (
      <Typography sx={{ color: "red", mb: 2 }}>
        Error: {combinedError}
      </Typography>
    );
  }

  // Display loading state until basic poolInfo (and ctx) is available
  if (poolLoading || !poolInfo || !ctx) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography>Loading pool data...</Typography>
      </Box>
    );
  }

  // === Main Component Render (only when all required data is available) ===
  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: 3 }}>
      <PriceRangeHeader />

      <RangeToggle value={rangeType} onChange={setRangeType} />

      <CurrentPoolPrice price={poolInfo.currentPrice} />

      {rangeType === "customRange" && (
        <LiquidityChart
          histogramData={histogramData}
          isLoading={histogramLoading}
          minTick={minTick} // Pass the main, debounced user-selected range
          maxTick={maxTick} // Pass the main, debounced user-selected range
          onMinTickChange={setMinTick} // Pass direct setters for LiquidityChart to debounce internally
          onMaxTickChange={setMaxTick} // Pass direct setters for LiquidityChart to debounce internally
          tokenDecimalsA={poolInfo.tokenA.decimals}
          tokenDecimalsB={poolInfo.tokenB.decimals}
          tickSpacing={poolInfo.tickSpacing}
          chartMinTick={leftMostTick} // Chart's overall X-axis domain (from data fetch range)
          chartMaxTick={rightMostTick} // Chart's overall X-axis domain (from data fetch range)
        />
      )}

      <PriceRange // KEPT ORIGINAL NAME
        currentPrice={poolInfo.currentPrice}
        tickSpacing={poolInfo.tickSpacing}
        minTick={minTick} // Pass the main, debounced ticks for input fields
        maxTick={maxTick} // Pass the main, debounced ticks for input fields
        onMinTickChange={setMinTick} // Direct setters for manual input
        onMaxTickChange={setMaxTick} // Direct setters for manual input
        tokenDecimalsA={poolInfo.tokenA.decimals} // NEW: Pass decimals for conversion
        tokenDecimalsB={poolInfo.tokenB.decimals} // NEW: Pass decimals for conversion
      />
    </Box>
  );
}
