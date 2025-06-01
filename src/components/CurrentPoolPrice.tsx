"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface CurrentPoolPriceProps {
  price: string;
}

export default function CurrentPoolPrice({ price }: CurrentPoolPriceProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 10; // 10% per second
        return newProgress >= 100 ? 0 : newProgress;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ textAlign: "center", mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "0.1px",
          }}
        >
          -- CURRENT POOL PRICE
        </Typography>
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 500,
            color: "white",
          }}
        >
          {price} USDC per SOL
        </Typography>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={16}
          thickness={4}
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            ml: 1,
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
      </Box>
    </Box>
  );
}
