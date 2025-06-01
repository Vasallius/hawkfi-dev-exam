import { Box, Slider, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { HistogramBin } from "../types/pool";

interface LiquidityChartProps {
  histogramData: HistogramBin[];
  isLoading: boolean;
}

const LiquidityChartComponent = ({
  histogramData,
  isLoading,
}: LiquidityChartProps) => {
  const chartContent = useMemo(() => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="price"
            stroke="#ccc"
            fontSize={10}
            interval="preserveStartEnd"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #46EB80",
              borderRadius: "4px",
            }}
            labelStyle={{ color: "#46EB80" }}
          />
          <Bar
            dataKey="liquidity"
            fill="#46EB80"
            opacity={0.8}
            name="Liquidity (Millions)"
          >
            {histogramData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isActive ? "#46EB80" : "#666666"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }, [histogramData]);

  // Get min and max price values from histogram data
  const priceRange = useMemo(() => {
    if (!histogramData.length) return { min: 0, max: 1000 };
    return {
      min: Math.min(...histogramData.map((bin) => parseFloat(bin.price))),
      max: Math.max(...histogramData.map((bin) => parseFloat(bin.price))),
    };
  }, [histogramData]);

  const [sliderValue, setSliderValue] = useState<number[]>([
    priceRange.min,
    priceRange.max,
  ]);

  const canRenderSlider = true; // Always try to render for now

  if (isLoading) {
    return null;
  }

  if (!histogramData.length && !isLoading) {
    // Added !isLoading to show slider even if data is loading/absent for dev
    return (
      <Typography sx={{ color: "#ccc" }}>
        No liquidity data available
      </Typography>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "1200px" }}>
      <Typography variant="h5" sx={{ mb: 2, color: "#46EB80" }}>
        Liquidity Distribution (±1000 ticks)
      </Typography>
      <Typography sx={{ mb: 2, fontSize: "0.9rem" }}>
        Showing {histogramData.length} initialized ticks with liquidity. Y-axis
        shows liquidity in millions.
      </Typography>
      <Box sx={{ position: "relative", width: "100%", height: 400 }}>
        {chartContent} {/* Render the memoized chart */}
        {canRenderSlider && (
          <Slider
            value={sliderValue}
            onChange={(_, newValue) => {
              setSliderValue(newValue as number[]);
              console.log("Slider changed to:", newValue);
            }}
            min={priceRange.min}
            max={priceRange.max}
            step={(priceRange.max - priceRange.min) / 100} // 100 discrete steps
            valueLabelDisplay="auto"
            sx={{
              position: "absolute",
              color: "#46EB80",
              left: "20px", // Match chart margin
              right: "20px", // Match chart margin
              width: "calc(100% - 40px)", // Adjust for left + right margins
              bottom: 35, // Adjust to align with x-axis
              zIndex: 10,
              "& .MuiSlider-thumb": {
                backgroundColor: "#DC92FC",
                border: "2px solid white",
                boxShadow: "0px 0px 5px 0px #DC92FC",
              },
              "& .MuiSlider-track": {
                backgroundColor: "#DC92FC",
                height: 8,
                opacity: 0.6,
              },
              "& .MuiSlider-rail": {
                backgroundColor: "rgba(102, 102, 102, 0.5)",
                height: 8,
              },
            }}
          />
        )}
      </Box>

      <Typography sx={{ mt: 2, fontSize: "0.8rem", color: "#ccc" }}>
        Each bar represents a price range with aggregated gross liquidity.
        Higher bars indicate more liquidity concentrated around that price
        level.
      </Typography>
    </Box>
  );
};

// Wrap the named component with React.memo
const MemoizedLiquidityChart = React.memo(LiquidityChartComponent);

export default MemoizedLiquidityChart;
