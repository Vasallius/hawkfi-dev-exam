import { Box, Typography } from "@mui/material";
import { PoolDisplayInfo } from "../types/pool";

interface PoolInfoProps {
  poolInfo: PoolDisplayInfo;
}

export default function PoolInfo({ poolInfo }: PoolInfoProps) {
  return (
    <Box sx={{ textAlign: "left", width: "100%", maxWidth: "800px", mb: 4 }}>
      <Typography sx={{ mb: 1 }}>
        Pool Address: {poolInfo.poolAddress}
      </Typography>
      <Typography sx={{ mb: 1 }}>
        Token A ({poolInfo.tokenA.symbol}): {poolInfo.tokenA.mint.toBase58()}{" "}
        (Decimals: {poolInfo.tokenA.decimals})
      </Typography>
      <Typography sx={{ mb: 1 }}>
        Token B ({poolInfo.tokenB.symbol}): {poolInfo.tokenB.mint.toBase58()}{" "}
        (Decimals: {poolInfo.tokenB.decimals})
      </Typography>
      <Typography sx={{ mb: 1, fontWeight: "bold", fontSize: "1.2rem" }}>
        Current Price: {poolInfo.currentPrice} {poolInfo.tokenB.symbol} per{" "}
        {poolInfo.tokenA.symbol}
      </Typography>
      <Typography sx={{ mb: 1 }}>
        Current Tick Index: {poolInfo.tickCurrentIndex}
      </Typography>
      <Typography sx={{ mb: 1 }}>
        Tick Spacing: {poolInfo.tickSpacing}
      </Typography>
      <Typography sx={{ mb: 1 }}>
        Liquidity in Pool: {poolInfo.liquidity}
      </Typography>
    </Box>
  );
}
