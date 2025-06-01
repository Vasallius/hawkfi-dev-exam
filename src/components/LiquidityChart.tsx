import { Box, CircularProgress, Slider, Typography } from "@mui/material";
import { PriceMath } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import React, { useCallback, useEffect, useMemo, useState } from "react"; // Import useRef
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
  isFetching?: boolean;
  minTick: number;
  maxTick: number;
  onMinTickChange: (tick: number) => void;
  onMaxTickChange: (tick: number) => void;
  tokenDecimalsA: number;
  tokenDecimalsB: number;
  tickSpacing: number;
  chartMinTick: number;
  chartMaxTick: number;
}

const LiquidityChartComponent = ({
  histogramData,
  isLoading,
  isFetching = false,
  minTick,
  maxTick,
  onMinTickChange,
  onMaxTickChange,
  tokenDecimalsA,
  tokenDecimalsB,
  tickSpacing,
  chartMinTick,
  chartMaxTick,
}: LiquidityChartProps) => {
  // State to track if the slider is currently being dragged
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // === Internal state for the slider's immediate visual updates ===
  // These will update rapidly as the slider moves
  const [sliderMinPrice, setSliderMinPrice] = useState<number>(0);
  const [sliderMaxPrice, setSliderMaxPrice] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number[]>([]);

  // Calculate the overall min/max bounds for the slider's scale
  const sliderPriceBounds = useMemo(() => {
    if (!histogramData.length && chartMinTick === 0 && chartMaxTick === 0) {
      // Return sensible defaults if data isn't ready or ticks are zero
      return { min: 0, max: 100 }; // A small range if no data, to avoid division by zero or huge ranges for step.
    }

    const minPossiblePrice = PriceMath.tickIndexToPrice(
      chartMinTick,
      tokenDecimalsA,
      tokenDecimalsB
    ).toNumber();
    let maxPossiblePrice = PriceMath.tickIndexToPrice(
      chartMaxTick,
      tokenDecimalsA,
      tokenDecimalsB
    ).toNumber();

    if (minPossiblePrice >= maxPossiblePrice) {
      // Ensure maxPossiblePrice is strictly greater than minPossiblePrice for slider functionality
      maxPossiblePrice = minPossiblePrice + 1;
    }

    return {
      min: minPossiblePrice,
      max: maxPossiblePrice,
    };
  }, [
    chartMinTick,
    chartMaxTick,
    tokenDecimalsA,
    tokenDecimalsB,
    histogramData.length,
  ]);

  // Effect to INITIALIZE `sliderValue` and `sliderMinPrice`/`sliderMaxPrice`
  // This will only run if the slider is NOT currently being dragged.
  useEffect(() => {
    // Crucial: Do not update internal slider state if currently dragging
    if (isDragging) {
      return;
    }

    if (minTick !== 0 || maxTick !== 0) {
      const initialMinPrice = PriceMath.tickIndexToPrice(
        minTick,
        tokenDecimalsA,
        tokenDecimalsB
      ).toNumber();
      const initialMaxPrice = PriceMath.tickIndexToPrice(
        maxTick,
        tokenDecimalsA,
        tokenDecimalsB
      ).toNumber();

      // Only update if the current slider values are meaningfully different
      // from what the parent's minTick/maxTick represent.
      // Use a small epsilon for floating point comparison to avoid
      // tiny, imperceptible differences causing unnecessary re-renders.
      const epsilon = 1e-9;
      if (
        Math.abs(sliderMinPrice - initialMinPrice) > epsilon ||
        Math.abs(sliderMaxPrice - initialMaxPrice) > epsilon ||
        sliderValue[0] === undefined // Initial render case
      ) {
        setSliderMinPrice(initialMinPrice);
        setSliderMaxPrice(initialMaxPrice);
        setSliderValue([initialMinPrice, initialMaxPrice]);
      }
    } else {
      // Handle initial state where minTick/maxTick might be 0, but you want to set bounds
      // This part depends on desired default behavior.
      // For now, if no ticks, we might just use the overall chart bounds.
      if (sliderValue[0] === undefined) {
        // Only set initial if not already set
        setSliderMinPrice(sliderPriceBounds.min);
        setSliderMaxPrice(sliderPriceBounds.max);
        setSliderValue([sliderPriceBounds.min, sliderPriceBounds.max]);
      }
    }
  }, [
    minTick,
    maxTick,
    tokenDecimalsA,
    tokenDecimalsB,
    isDragging, // Add isDragging to dependencies
    sliderMinPrice,
    sliderMaxPrice,
    sliderValue, // Add sliderValue to avoid infinite loop when it changes
    sliderPriceBounds.min, // Add bounds for the else clause
    sliderPriceBounds.max, // Add bounds for the else clause
  ]);

  // Handler for direct slider updates (called rapidly by MUI Slider when dragging)
  const handleSliderChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      // Set dragging state to true
      setIsDragging(true);

      const values = newValue as number[];
      setSliderValue(values); // Update internal state immediately for smooth dragging
      setSliderMinPrice(values[0]); // Update temp price displays
      setSliderMaxPrice(values[1]); // Update temp price displays
    },
    []
  );

  // Handler for when the user LETS GO of the slider (committing the change)
  const handleSliderChangeCommitted = useCallback(
    (
      _: Event | React.SyntheticEvent<Element, Event>,
      newValue: number | number[]
    ) => {
      // Set dragging state back to false
      setIsDragging(false);

      const values = newValue as number[];

      // Convert prices back to initializable ticks
      const newMinTickConverted = PriceMath.priceToInitializableTickIndex(
        new Decimal(values[0]),
        tokenDecimalsA,
        tokenDecimalsB,
        tickSpacing
      );
      const newMaxTickConverted = PriceMath.priceToInitializableTickIndex(
        new Decimal(values[1]),
        tokenDecimalsA,
        tokenDecimalsB,
        tickSpacing
      );

      // Call the parent's functions directly
      onMinTickChange(newMinTickConverted);
      onMaxTickChange(newMaxTickConverted);
      console.log(
        "Update to parent (minTick/maxTick) committed:",
        newMinTickConverted,
        newMaxTickConverted
      );
    },
    [
      onMinTickChange,
      onMaxTickChange,
      tokenDecimalsA,
      tokenDecimalsB,
      tickSpacing,
    ]
  );

  // Memoize the actual chart rendering content
  const chartContent = useMemo(() => {
    const xAxisDomainMinPrice = PriceMath.tickIndexToPrice(
      chartMinTick,
      tokenDecimalsA,
      tokenDecimalsB
    ).toNumber();
    const xAxisDomainMaxPrice = PriceMath.tickIndexToPrice(
      chartMaxTick,
      tokenDecimalsA,
      tokenDecimalsB
    ).toNumber();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="priceLowNum"
            stroke="#ccc"
            fontSize={10}
            interval="preserveStartEnd"
            type="number"
            domain={[xAxisDomainMinPrice, xAxisDomainMaxPrice]}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #46EB80",
              borderRadius: "4px",
            }}
            labelStyle={{ color: "#46EB80" }}
            formatter={(value: number) => [value.toFixed(2), "Liquidity"]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="liquidity"
            fill="#46EB80"
            opacity={isFetching ? 0.5 : 0.8}
            name="Liquidity (Millions)"
            isAnimationActive={false}
          >
            {histogramData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.tick >= minTick && entry.tick <= maxTick
                    ? "#46EB80"
                    : "#333"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }, [
    histogramData,
    chartMinTick,
    chartMaxTick,
    tokenDecimalsA,
    tokenDecimalsB,
    minTick,
    maxTick,
    isFetching,
  ]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 400,
        }}
      >
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography>Loading liquidity data...</Typography>
      </Box>
    );
  }

  if (!histogramData.length && !isLoading) {
    return (
      <Typography
        sx={{
          color: "#ccc",
          height: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        No liquidity data available for this range.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "1200px" }}>
      <Typography variant="h5" sx={{ mb: 2, color: "#46EB80" }}>
        Liquidity Distribution
      </Typography>
      <Typography sx={{ mb: 2, fontSize: "0.9rem" }}>
        Showing {histogramData.length} data points with liquidity. Y-axis shows
        liquidity in millions.
      </Typography>
      <Box sx={{ position: "relative", width: "100%", height: 400 }}>
        {chartContent}
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          min={sliderPriceBounds.min}
          max={sliderPriceBounds.max}
          // The step should be a reasonable value for the price range
          // Calculate a dynamic step based on the full range
          step={
            (sliderPriceBounds.max - sliderPriceBounds.min) / 1000 || // Divide by 1000 to get fine control
            0.01 // Fallback step to prevent NaN if range is 0 or very small
          }
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => value.toFixed(2)}
          disableSwap
          sx={{
            position: "absolute",
            color: "#46EB80",
            left: "20px",
            right: "20px",
            width: "calc(100% - 40px)",
            bottom: 35,
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
      </Box>

      <Typography sx={{ mt: 2, fontSize: "0.8rem", color: "#ccc" }}>
        Each bar represents a price range with aggregated gross liquidity.
        Higher bars indicate more liquidity concentrated around that price
        level.
      </Typography>
    </Box>
  );
};

const MemoizedLiquidityChart = React.memo(LiquidityChartComponent);

export default MemoizedLiquidityChart;
