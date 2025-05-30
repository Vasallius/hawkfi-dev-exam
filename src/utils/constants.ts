import { PublicKey } from "@solana/web3.js";

export const RPC_ENDPOINT =
  "https://mainnet.helius-rpc.com/?api-key=5c8446a8-4a69-4fc8-9ca6-44a560bd5082";
export const WHIRLPOOL_PROGRAM_ID =
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc";
export const SOL_USDC_POOL_ADDRESS =
  "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE";

export const KNOWN_TOKENS = {
  SOL: {
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    symbol: "SOL",
    decimals: 9,
  },
  USDC: {
    mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    symbol: "USDC",
    decimals: 6,
  },
};
