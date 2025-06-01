import { WhirlpoolContext } from "@orca-so/whirlpools-sdk";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { HistogramBin, LiquidityPoint, PoolDisplayInfo } from "../types/pool";
import { SOL_USDC_POOL_ADDRESS } from "../utils/constants";
import {
  createHistogramBins,
  fetchWhirlpoolTickArraysAndLiquidity,
} from "../utils/pool";

interface UseLiquidityHistogramResult {
  histogramData: HistogramBin[];
  loading: boolean;
  error: string | null;
}

interface UseLiquidityHistogramProps {
  poolInfo: PoolDisplayInfo | null;
  ctx: WhirlpoolContext | null; // <-- Now receive ctx as a prop
  chartMinTick: number;
  chartMaxTick: number;
  userMinTick?: number;
  userMaxTick?: number;
}

export function useLiquidityHistogram({
  poolInfo,
  ctx, // <-- Destructure ctx from props
  chartMinTick,
  chartMaxTick,
  userMinTick,
  userMaxTick,
}: UseLiquidityHistogramProps): UseLiquidityHistogramResult {
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistogram = async () => {
      // Must have poolInfo and ctx to fetch histogram
      if (
        !poolInfo ||
        !ctx || // <-- Check for ctx here
        isNaN(chartMinTick) ||
        isNaN(chartMaxTick) ||
        chartMinTick > chartMaxTick
      ) {
        setHistogramData([]);
        setLoading(false); // Ensure loading is false if fetch is skipped
        setError(null); // Clear error if conditions are not met
        return;
      }

      setError(null);
      setLoading(true);
      try {
        const poolAddress = new PublicKey(SOL_USDC_POOL_ADDRESS);

        const liquidityPoints: LiquidityPoint[] =
          await fetchWhirlpoolTickArraysAndLiquidity(
            ctx,
            poolAddress,
            chartMinTick,
            chartMaxTick,
            poolInfo.tokenA.decimals,
            poolInfo.tokenB.decimals,
            poolInfo.tickSpacing
          );

        const markedLiquidityPoints = liquidityPoints.map((point) => ({
          ...point,
          isActive:
            userMinTick !== undefined &&
            userMaxTick !== undefined &&
            point.tickIndex >= userMinTick &&
            point.tickIndex <= userMaxTick,
        }));

        const histogramBins = createHistogramBins(markedLiquidityPoints);
        setHistogramData(histogramBins);
      } catch (err) {
        console.error("Error fetching histogram data:", err);
        setError(err instanceof Error ? err.message : String(err));
        setHistogramData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistogram();
  }, [poolInfo, ctx, chartMinTick, chartMaxTick, userMinTick, userMaxTick]);

  return { histogramData, loading, error };
}
