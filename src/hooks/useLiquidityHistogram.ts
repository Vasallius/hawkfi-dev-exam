import { WhirlpoolContext } from "@orca-so/whirlpools-sdk";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { HistogramBin, LiquidityPoint, PoolDisplayInfo } from "../types/pool";
import { SOL_USDC_POOL_ADDRESS } from "../utils/constants";
import {
  createHistogramBins,
  fetchWhirlpoolTickArraysAndLiquidity,
} from "../utils/pool";

interface UseLiquidityHistogramProps {
  poolInfo: PoolDisplayInfo | null;
  ctx: WhirlpoolContext | null;
  chartMinTick: number;
  chartMaxTick: number;
  userMinTick?: number;
  userMaxTick?: number;
}

const fetchHistogramData = async ({
  poolInfo,
  ctx,
  chartMinTick,
  chartMaxTick,
  userMinTick,
  userMaxTick,
}: UseLiquidityHistogramProps): Promise<HistogramBin[]> => {
  if (
    !poolInfo ||
    !ctx ||
    isNaN(chartMinTick) ||
    isNaN(chartMaxTick) ||
    chartMinTick > chartMaxTick
  ) {
    return [];
  }

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

  return createHistogramBins(markedLiquidityPoints);
};

export function useLiquidityHistogram(props: UseLiquidityHistogramProps) {
  return useQuery({
    queryKey: [
      "liquidityHistogram",
      props.poolInfo?.poolAddress,
      props.chartMinTick,
      props.chartMaxTick,
      props.userMinTick,
      props.userMaxTick,
    ],
    queryFn: () => fetchHistogramData(props),
    enabled: !!props.poolInfo && !!props.ctx,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}
