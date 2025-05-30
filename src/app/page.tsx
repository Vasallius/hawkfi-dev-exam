"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PriceMath,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import LiquidityChart from "../components/LiquidityChart";
import PoolInfo from "../components/PoolInfo";
import { HistogramBin, PoolDisplayInfo } from "../types/pool";
import { RPC_ENDPOINT, SOL_USDC_POOL_ADDRESS } from "../utils/constants";
import {
  DummyWallet,
  createHistogramBins,
  createLiquidityHistogram,
  getDisplaySymbol,
  getTokenDecimals,
} from "../utils/pool";

export default function Home() {
  const [poolInfo, setPoolInfo] = useState<PoolDisplayInfo | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [histogramLoading, setHistogramLoading] = useState<boolean>(false);

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
        console.log("Fetching pool data for:", poolAddress.toBase58());

        const fetchedPoolData = await ctx.fetcher.getPool(poolAddress);
        if (!fetchedPoolData) {
          throw new Error("Failed to fetch pool data");
        }

        // Get token decimals
        const decimalsA = await getTokenDecimals(
          connection,
          fetchedPoolData.tokenMintA
        );
        const decimalsB = await getTokenDecimals(
          connection,
          fetchedPoolData.tokenMintB
        );

        // Calculate current price
        const price = PriceMath.sqrtPriceX64ToPrice(
          fetchedPoolData.sqrtPrice,
          decimalsA,
          decimalsB
        );

        // Create pool info object
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

        // Create liquidity histogram
        setHistogramLoading(true);
        const liquidityPoints = await createLiquidityHistogram(
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#070D0AE5",
        color: "white",
        p: 3,
        fontFamily: "monospace",
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 3, color: "#46EB80" }}>
        SOL/USDC Pool Liquidity Analysis
      </Typography>

      {error && (
        <Typography sx={{ color: "red", mb: 2 }}>Error: {error}</Typography>
      )}

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography>Loading pool data...</Typography>
        </Box>
      )}

      {poolInfo && <PoolInfo poolInfo={poolInfo} />}

      {histogramLoading && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography>Creating liquidity histogram...</Typography>
        </Box>
      )}

      <LiquidityChart
        histogramData={histogramData}
        isLoading={histogramLoading}
      />
    </Box>
  );
}
