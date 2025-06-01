"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PriceMath,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { Decimal } from "decimal.js";
import { useEffect, useState } from "react";
import { HistogramBin, PoolDisplayInfo } from "../types/pool";
import { RPC_ENDPOINT, SOL_USDC_POOL_ADDRESS } from "../utils/constants";
import {
  DummyWallet,
  createHistogramBins,
  createLiquidityHistogram,
  getDisplaySymbol,
  getTokenDecimals,
} from "../utils/pool";
import CurrentPoolPrice from "./CurrentPoolPrice";
import LiquidityChart from "./LiquidityChart";
import PriceRange from "./PriceRange";
import PriceRangeHeader from "./PriceRangeHeader";
import RangeToggle from "./RangeToggle";

export default function PoolInterface() {
  const [poolInfo, setPoolInfo] = useState<PoolDisplayInfo | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [histogramLoading, setHistogramLoading] = useState<boolean>(false);
  const [rangeType, setRangeType] = useState<"customRange" | "fullRange">(
    "customRange"
  );

  const [minTick, setMinTick] = useState<number>(0);
  const [maxTick, setMaxTick] = useState<number>(0);
  const [rightMostPrice, setRightMostPrice] = useState<string>("0");

  useEffect(() => {
    const fetchPoolDataAndHistogram = async () => {
      setError(null);
      setLoading(true);

      try {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const wallet = new DummyWallet();
        const ctx = WhirlpoolContext.from(
          connection,
          wallet,
          ORCA_WHIRLPOOL_PROGRAM_ID
        );

        const poolAddress = new PublicKey(SOL_USDC_POOL_ADDRESS);
        const fetchedPoolData = await ctx.fetcher.getPool(poolAddress);
        if (!fetchedPoolData) {
          throw new Error("Failed to fetch pool data");
        }

        const decimalsA = await getTokenDecimals(
          connection,
          fetchedPoolData.tokenMintA
        );
        const decimalsB = await getTokenDecimals(
          connection,
          fetchedPoolData.tokenMintB
        );

        const price = PriceMath.sqrtPriceX64ToPrice(
          fetchedPoolData.sqrtPrice,
          decimalsA,
          decimalsB
        );

        const currentPrice = new Decimal(price.toString());
        const minPrice = currentPrice.mul(0.9);
        const maxPrice = currentPrice.mul(1.1);

        const minPriceTick = PriceMath.priceToInitializableTickIndex(
          minPrice,
          decimalsA,
          decimalsB,
          fetchedPoolData.tickSpacing
        );
        const maxPriceTick = PriceMath.priceToInitializableTickIndex(
          maxPrice,
          decimalsA,
          decimalsB,
          fetchedPoolData.tickSpacing
        );

        setMinTick(minPriceTick);
        setMaxTick(maxPriceTick);

        console.log("minmaxtick", minPriceTick, maxPriceTick);

        const poolDisplayInfo: PoolDisplayInfo = {
          poolAddress: fetchedPoolData.whirlpoolsConfig.toBase58(),
          tokenA: {
            mint: fetchedPoolData.tokenMintA,
            symbol: getDisplaySymbol(fetchedPoolData.tokenMintA),
            decimals: decimalsA,
          },
          tokenB: {
            mint: fetchedPoolData.tokenMintB,
            symbol: getDisplaySymbol(fetchedPoolData.tokenMintB),
            decimals: decimalsB,
          },
          currentPrice: price.toSignificantDigits(8).toString(),
          tickCurrentIndex: fetchedPoolData.tickCurrentIndex,
          tickSpacing: fetchedPoolData.tickSpacing,
          liquidity: fetchedPoolData.liquidity.toString(),
        };

        setPoolInfo(poolDisplayInfo);
        setLoading(false);

        setHistogramLoading(true);
        const liquidityPoints = await createLiquidityHistogram(
          poolDisplayInfo,
          ctx,
          poolAddress,
          fetchedPoolData.tickCurrentIndex,
          fetchedPoolData.tickSpacing,
          fetchedPoolData.liquidity.toString(),
          decimalsA,
          decimalsB
        );

        const histogramBins = createHistogramBins(liquidityPoints);
        setHistogramData(histogramBins);
        setHistogramLoading(false);
      } catch (err) {
        console.error("Error in fetchPoolDataAndHistogram:", err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
        setHistogramLoading(false);
      }
    };

    fetchPoolDataAndHistogram();
  }, []);

  if (error) {
    return <Typography sx={{ color: "red", mb: 2 }}>Error: {error}</Typography>;
  }

  if (loading || !poolInfo) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          histogramData={histogramData}
          isLoading={histogramLoading}
        />
      )}

      <PriceRange
        currentPrice={poolInfo.currentPrice}
        tickSpacing={poolInfo.tickSpacing}
        minTick={minTick}
        maxTick={maxTick}
        onMinTickChange={setMinTick}
        onMaxTickChange={setMaxTick}
      />
    </Box>
  );
}
