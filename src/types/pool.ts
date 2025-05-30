import { PublicKey } from "@solana/web3.js";

export interface ParsedSplTokenMintInfo {
  mintAuthority: string | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

export interface ParsedAccountData {
  program: string;
  parsed: {
    type: string;
    info: ParsedSplTokenMintInfo;
  };
  space: number;
}

export interface LiquidityPoint {
  tickIndex: number;
  liquidityNet: string;
  liquidityGross: string;
  price: number;
  priceFormatted: string;
  isActive: boolean;
}

export interface HistogramBin {
  tick: number;
  price: string;
  liquidity: number;
  change: number;
  priceLowNum?: number;
  priceHighNum?: number;
  isActive: boolean;
}

export interface TokenDecimals {
  a: number;
  b: number;
}

export interface PoolDisplayInfo {
  poolAddress: string;
  tokenA: {
    mint: PublicKey;
    symbol: string;
    decimals: number;
  };
  tokenB: {
    mint: PublicKey;
    symbol: string;
    decimals: number;
  };
  currentPrice: string;
  tickCurrentIndex: number;
  tickSpacing: number;
  liquidity: string;
}
