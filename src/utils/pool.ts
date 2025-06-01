import { Wallet } from "@coral-xyz/anchor";
import {
  PDAUtil,
  PriceMath,
  TickArrayUtil,
  TickUtil,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import Decimal from "decimal.js";
import {
  HistogramBin,
  LiquidityPoint,
  ParsedAccountData,
  PoolDisplayInfo,
} from "../types/pool";
import { KNOWN_TOKENS } from "./constants";

// Dummy wallet for read-only access
export class DummyWallet implements Wallet {
  payer: Keypair;
  publicKey: PublicKey;
  constructor() {
    this.payer = Keypair.generate();
    this.publicKey = this.payer.publicKey;
  }
  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> {
    return tx;
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs;
  }
}

export const getDisplaySymbol = (mintAddress: PublicKey | undefined) => {
  if (!mintAddress) return "N/A";
  const knownToken = Object.values(KNOWN_TOKENS).find(
    (token) => token.mint.toBase58() === mintAddress.toBase58()
  );
  return knownToken
    ? knownToken.symbol
    : mintAddress.toBase58().substring(0, 6) + "...";
};

export async function fetchWhirlpoolTickArraysAndLiquidity(
  ctx: WhirlpoolContext,
  poolAddress: PublicKey,
  startTickFetch: number, // The absolute start tick for fetching data
  endTickFetch: number, // The absolute end tick for fetching data
  tokenDecimalsA: number,
  tokenDecimalsB: number,
  tickSpacing: number
): Promise<LiquidityPoint[]> {
  console.log(
    "Fetching liquidity data for range (raw):",
    startTickFetch,
    "-",
    endTickFetch
  );

  const tickIndices: number[] = [];
  // Ensure we get all initializable ticks within the *exact* range provided
  for (
    let tick = TickUtil.getInitializableTickIndex(startTickFetch, tickSpacing);
    tick <= endTickFetch;
    tick = TickUtil.getNextInitializableTickIndex(tick, tickSpacing)
  ) {
    tickIndices.push(tick);
  }

  // Get unique start tick indices of tick-arrays to minimize RPC calls
  const uniqueStartTicks = new Set<number>();
  tickIndices.forEach((tickIndex) => {
    const startTickIndex = TickUtil.getStartTickIndex(tickIndex, tickSpacing);
    uniqueStartTicks.add(startTickIndex);
  });

  const tickArrayPDAs = Array.from(uniqueStartTicks).map((startTick) =>
    PDAUtil.getTickArray(ctx.program.programId, poolAddress, startTick)
  );

  const tickArrayAddresses = tickArrayPDAs.map((pda) => pda.publicKey);
  const tickArraysData = await ctx.fetcher.getTickArrays(tickArrayAddresses);

  const tickArrayMap = new Map();
  const uniqueStartTicksArray = Array.from(uniqueStartTicks);
  tickArraysData.forEach((tickArrayData, index) => {
    if (tickArrayData) {
      tickArrayMap.set(uniqueStartTicksArray[index], tickArrayData);
    }
  });

  const liquidityPoints: LiquidityPoint[] = [];
  const sortedTickIndices = tickIndices.sort((a, b) => a - b);

  for (const tickIndex of sortedTickIndices) {
    try {
      const startTickIndex = TickUtil.getStartTickIndex(tickIndex, tickSpacing);
      const tickArrayData = tickArrayMap.get(startTickIndex);

      // Default values if tickData is not found or not initialized
      let liquidityNet = "0";
      let liquidityGross = "0";

      if (tickArrayData) {
        const tickData = TickArrayUtil.getTickFromArray(
          tickArrayData,
          tickIndex,
          tickSpacing
        );
        liquidityNet = tickData.initialized
          ? tickData.liquidityNet.toString()
          : "0";
        liquidityGross = tickData.initialized
          ? tickData.liquidityGross.toString()
          : "0";
      }

      const price = PriceMath.tickIndexToPrice(
        tickIndex,
        tokenDecimalsA,
        tokenDecimalsB
      );

      liquidityPoints.push({
        tickIndex,
        liquidityNet,
        liquidityGross,
        price: price.toNumber(),
        priceFormatted: price.toFixed(6),
        isActive: false,
      });
    } catch (error) {
      console.error(`Error processing tick ${tickIndex}:`, error);
      const price = PriceMath.tickIndexToPrice(
        tickIndex,
        tokenDecimalsA,
        tokenDecimalsB
      );
      liquidityPoints.push({
        tickIndex,
        liquidityNet: "0",
        liquidityGross: "0",
        price: price.toNumber(),
        priceFormatted: price.toFixed(6),
        isActive: false,
      });
    }
  }

  return liquidityPoints.sort((a, b) => a.tickIndex - b.tickIndex);
}
export async function createLiquidityHistogram(
  poolDisplayInfo: PoolDisplayInfo,
  ctx: WhirlpoolContext,
  poolAddress: PublicKey,
  currentTickIndex: number,
  tickSpacing: number,
  currentLiquidity: string,
  tokenDecimalsA: number,
  tokenDecimalsB: number
): Promise<LiquidityPoint[]> {
  console.log("Creating liquidity histogram...");

  const currentPrice = new Decimal(poolDisplayInfo.currentPrice);

  const minPrice = currentPrice.mul(0.9);
  const maxPrice = currentPrice.mul(1.1);
  const leftMostPrice = minPrice.mul(0.9);
  const rightMostPrice = maxPrice.mul(1.1);

  const minPriceTick = PriceMath.priceToInitializableTickIndex(
    minPrice,
    tokenDecimalsA,
    tokenDecimalsB,
    tickSpacing
  );
  const maxPriceTick = PriceMath.priceToInitializableTickIndex(
    maxPrice,
    tokenDecimalsA,
    tokenDecimalsB,
    tickSpacing
  );

  const leftMostPriceTick = PriceMath.priceToInitializableTickIndex(
    leftMostPrice,
    tokenDecimalsA,
    tokenDecimalsB,
    tickSpacing
  );
  const rightMostPriceTick = PriceMath.priceToInitializableTickIndex(
    rightMostPrice,
    tokenDecimalsA,
    tokenDecimalsB,
    tickSpacing
  );

  const tickIndices: number[] = [];

  // Get nearest initializable tick index from lower bounder
  // Iterate until upper bound initializable tick index
  for (
    let tick = TickUtil.getInitializableTickIndex(
      leftMostPriceTick,
      tickSpacing
    );
    tick <= rightMostPriceTick;
    tick = TickUtil.getNextInitializableTickIndex(tick, tickSpacing)
  ) {
    tickIndices.push(tick);
  }

  // Get unique start tick indices of tick-arrays

  const uniqueStartTicks = new Set<number>();
  tickIndices.forEach((tickIndex) => {
    const startTickIndex = TickUtil.getStartTickIndex(tickIndex, tickSpacing);
    uniqueStartTicks.add(startTickIndex);
  });

  // Get tick-array PDAs

  const tickArrayPDAs = Array.from(uniqueStartTicks).map((startTick) =>
    PDAUtil.getTickArray(ctx.program.programId, poolAddress, startTick)
  );

  // Get tick-array data (to reference when looking up tick data)

  const tickArrayAddresses = tickArrayPDAs.map((pda) => pda.publicKey);
  const tickArraysData = await ctx.fetcher.getTickArrays(tickArrayAddresses);

  const tickArrayMap = new Map();
  const uniqueStartTicksArray = Array.from(uniqueStartTicks);
  tickArraysData.forEach((tickArrayData, index) => {
    if (tickArrayData) {
      tickArrayMap.set(uniqueStartTicksArray[index], tickArrayData);
    }
  });

  const liquidityPoints: LiquidityPoint[] = [];
  const sortedTickIndices = tickIndices.sort((a, b) => a - b);

  for (const tickIndex of sortedTickIndices) {
    try {
      const startTickIndex = TickUtil.getStartTickIndex(tickIndex, tickSpacing);
      const tickArrayData = tickArrayMap.get(startTickIndex);

      if (tickArrayData) {
        const tickData = TickArrayUtil.getTickFromArray(
          tickArrayData,
          tickIndex,
          tickSpacing
        );

        const price = PriceMath.tickIndexToPrice(
          tickIndex,
          tokenDecimalsA,
          tokenDecimalsB
        );

        const liquidityNet = tickData.initialized
          ? tickData.liquidityNet.toString()
          : "0";
        const liquidityGross = tickData.initialized
          ? tickData.liquidityGross.toString()
          : "0";

        liquidityPoints.push({
          tickIndex,
          liquidityNet,
          liquidityGross,
          price: price.toNumber(),
          priceFormatted: price.toFixed(6),
          isActive: tickIndex >= minPriceTick && tickIndex <= maxPriceTick,
        });
      }
    } catch (error) {
      console.log(`Error processing tick ${tickIndex}:`, error);
      const price = PriceMath.tickIndexToPrice(
        tickIndex,
        tokenDecimalsA,
        tokenDecimalsB
      );

      liquidityPoints.push({
        tickIndex,
        liquidityNet: "0",
        liquidityGross: "0",
        price: price.toNumber(),
        priceFormatted: price.toFixed(6),
        isActive: tickIndex >= minPriceTick && tickIndex <= maxPriceTick,
      });
    }
  }

  return liquidityPoints.sort((a, b) => a.tickIndex - b.tickIndex);
}

export function createHistogramBins(
  liquidityPoints: LiquidityPoint[]
): HistogramBin[] {
  if (!liquidityPoints || liquidityPoints.length === 0) {
    return [];
  }

  const sortedPoints = liquidityPoints.sort(
    (a, b) => a.tickIndex - b.tickIndex
  );
  let cumulativeLiquidity = new Decimal(0);

  const bins: HistogramBin[] = sortedPoints.map((point) => {
    cumulativeLiquidity = cumulativeLiquidity.plus(
      new Decimal(point.liquidityNet)
    );
    const sqrtPrice = new Decimal(point.price).sqrt();
    const virtualY = cumulativeLiquidity.times(sqrtPrice);
    const liquidityValue = virtualY.div(1e6);

    return {
      tick: point.tickIndex,
      price: point.priceFormatted,
      liquidity: liquidityValue.toNumber(),
      change: parseFloat(point.liquidityNet) / 1e6,
      priceLowNum: point.price,
      priceHighNum: point.price,
      isActive: point.isActive,
    };
  });

  return bins;
}

export async function getTokenDecimals(
  connection: Connection,
  mint: PublicKey
): Promise<number> {
  const knownToken = Object.values(KNOWN_TOKENS).find(
    (token) => token.mint.toBase58() === mint.toBase58()
  );

  if (knownToken) {
    return knownToken.decimals;
  }

  try {
    const mintInfo = await connection.getParsedAccountInfo(mint);
    if (mintInfo?.value?.data) {
      const parsedData = mintInfo.value.data as ParsedAccountData;
      if (parsedData.parsed?.info?.decimals !== undefined) {
        return parsedData.parsed.info.decimals;
      }
    }
  } catch (error) {
    console.error("Error fetching token decimals:", error);
  }

  throw new Error(`Could not determine decimals for token ${mint.toBase58()}`);
}
