// src/hooks/usePoolData.ts
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PriceMath,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { PoolDisplayInfo } from "../types/pool";
import { RPC_ENDPOINT, SOL_USDC_POOL_ADDRESS } from "../utils/constants";
import { DummyWallet, getDisplaySymbol, getTokenDecimals } from "../utils/pool";

const fetchPoolData = async () => {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const wallet = new DummyWallet();
  const whirlpoolContext = WhirlpoolContext.from(
    connection,
    wallet,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );

  const poolAddress = new PublicKey(SOL_USDC_POOL_ADDRESS);
  const fetchedPoolData = await whirlpoolContext.fetcher.getPool(poolAddress);

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

  return {
    poolInfo: {
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
    } as PoolDisplayInfo,
    ctx: whirlpoolContext,
  };
};

export function usePoolData() {
  return useQuery({
    queryKey: ["poolData"],
    queryFn: fetchPoolData,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
