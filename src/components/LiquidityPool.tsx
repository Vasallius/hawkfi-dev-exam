"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { PriceMath } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import { useEffect, useMemo, useState } from "react";

import { useLiquidityHistogram } from "../hooks/useLiquidityHistogram";
import { usePoolData } from "../hooks/usePoolData";

import CurrentPoolPrice from "./CurrentPoolPrice";
import LiquidityChart from "./LiquidityChart";
import PriceRange from "./PriceRange";
import PriceRangeHeader from "./PriceRangeHeader";
import RangeToggle from "./RangeToggle";

export default function LiquidityPool() {
  const {
    data: poolData,
    isLoading: poolLoading,
    error: poolError,
  } = usePoolData({
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  const poolInfo = poolData?.poolInfo ?? null;
  const ctx = poolData?.ctx ?? null;

  const [rangeType, setRangeType] = useState<"customRange" | "fullRange">(
    "customRange"
  );
  const [minTick, setMinTick] = useState<number>(0);
  const [maxTick, setMaxTick] = useState<number>(0);

  // NEED TO MEMOIZE THIS BECAUSE OF NEW DECIMAL FUNCTION INSTANCE
  const currentPriceDecimal = useMemo(() => {
    if (!poolInfo) return new Decimal(0);
    return new Decimal(poolInfo.currentPrice);
  }, [poolInfo]);

  useEffect(() => {
    if (
      poolInfo &&
      !currentPriceDecimal.isZero() &&
      minTick === 0 &&
      maxTick === 0
    ) {
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
    }
  }, [poolInfo, currentPriceDecimal, minTick, maxTick]);

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
    data: histogramData,
    isLoading: histogramLoading,
    error: histogramError,
  } = useLiquidityHistogram({
    poolInfo,
    ctx,
    chartMinTick: leftMostTick,
    chartMaxTick: rightMostTick,
    userMinTick: minTick,
    userMaxTick: maxTick,
  });

  // Combine errors for display
  const combinedError = poolError || histogramError;

  if (combinedError) {
    return (
      <Typography sx={{ color: "red", mb: 2 }}>
        Error:{" "}
        {combinedError instanceof Error
          ? combinedError.message
          : String(combinedError)}
      </Typography>
    );
  }

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

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: 3 }}>
      <PriceRangeHeader />
      <RangeToggle value={rangeType} onChange={setRangeType} />
      <CurrentPoolPrice price={poolInfo.currentPrice} />

      {rangeType === "customRange" && (
        <LiquidityChart
          histogramData={histogramData || []}
          isLoading={histogramLoading}
          isFetching={histogramLoading && histogramData !== undefined}
          minTick={minTick}
          maxTick={maxTick}
          onMinTickChange={setMinTick}
          onMaxTickChange={setMaxTick}
          tokenDecimalsA={poolInfo.tokenA.decimals}
          tokenDecimalsB={poolInfo.tokenB.decimals}
          tickSpacing={poolInfo.tickSpacing}
          chartMinTick={leftMostTick}
          chartMaxTick={rightMostTick}
          currentTick={poolInfo.tickCurrentIndex}
        />
      )}

      <PriceRange
        currentPrice={poolInfo.currentPrice}
        tickSpacing={poolInfo.tickSpacing}
        minTick={minTick}
        maxTick={maxTick}
        onMinTickChange={setMinTick}
        onMaxTickChange={setMaxTick}
        tokenDecimalsA={poolInfo.tokenA.decimals}
        tokenDecimalsB={poolInfo.tokenB.decimals}
      />
    </Box>
  );
}
