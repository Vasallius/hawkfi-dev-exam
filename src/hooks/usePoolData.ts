// src/hooks/usePoolData.ts
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PriceMath,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { PoolDisplayInfo } from "../types/pool";
import { RPC_ENDPOINT, SOL_USDC_POOL_ADDRESS } from "../utils/constants";
import { DummyWallet, getDisplaySymbol, getTokenDecimals } from "../utils/pool";

interface UsePoolDataResult {
  poolInfo: PoolDisplayInfo | null;
  ctx: WhirlpoolContext | null;
  loading: boolean;
  error: string | null;
}

export function usePoolData(): UsePoolDataResult {
  const [poolInfo, setPoolInfo] = useState<PoolDisplayInfo | null>(null);
  const [ctx, setCtx] = useState<WhirlpoolContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoolAndInitializeContext = async () => {
      setError(null);
      setLoading(true);
      try {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const wallet = new DummyWallet();
        // Initialize context first
        const whirlpoolContext = WhirlpoolContext.from(
          connection,
          wallet,
          ORCA_WHIRLPOOL_PROGRAM_ID
        );
        setCtx(whirlpoolContext);

        // Proceed to fetch pool data using the initialized context
        const poolAddress = new PublicKey(SOL_USDC_POOL_ADDRESS);
        const fetchedPoolData = await whirlpoolContext.fetcher.getPool(
          poolAddress
        );
        if (!fetchedPoolData) {
          throw new Error("Failed to fetch pool data");
        }

        const decimalsA = await getTokenDecimals(
          connection, // Use connection from context
          fetchedPoolData.tokenMintA
        );
        const decimalsB = await getTokenDecimals(
          connection, // Use connection from context
          fetchedPoolData.tokenMintB
        );

        const price = PriceMath.sqrtPriceX64ToPrice(
          fetchedPoolData.sqrtPrice,
          decimalsA,
          decimalsB
        );

        const displayInfo: PoolDisplayInfo = {
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

        setPoolInfo(displayInfo);
      } catch (err) {
        console.error("Error fetching pool data or initializing context:", err);
        setError(err instanceof Error ? err.message : String(err));
        setPoolInfo(null);
        setCtx(null); // Ensure ctx is null on any error
      } finally {
        setLoading(false);
      }
    };

    fetchPoolAndInitializeContext();
  }, []);

  return { poolInfo, ctx, loading, error }; // Return ctx
}
