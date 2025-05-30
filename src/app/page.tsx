"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PriceMath,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import PriceRange from "../components/PriceRange";
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#070D0AE5",
        color: "white",
        p: 3,
      }}
    >
      {error && (
        <Typography sx={{ color: "red", mb: 2 }}>Error: {error}</Typography>
      )}

      {loading ? (
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
      ) : (
        poolInfo && (
          <PriceRange
            currentPrice={poolInfo.currentPrice}
            histogramData={histogramData}
            histogramLoading={histogramLoading}
          />
        )
      )}
    </Box>
  );
}
