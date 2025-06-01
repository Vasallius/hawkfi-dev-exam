import { Box, CircularProgress, Slider, Typography } from "@mui/material";
import { PriceMath } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

// Debounce utility function (can be placed here or in a shared utils file)
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

interface LiquidityChartProps {
  histogramData: HistogramBin[];
  isLoading: boolean;
  // minTick / maxTick are the DEBOUNCED, "official" user-selected range from the parent
  minTick: number;
  maxTick: number;
  // Callbacks to update the parent's (LiquidityPool's) minTick/maxTick
  onMinTickChange: (tick: number) => void;
  onMaxTickChange: (tick: number) => void;
  tokenDecimalsA: number;
  tokenDecimalsB: number;
  tickSpacing: number;
  // chartMinTick / chartMaxTick define the actual range for the chart's X-axis domain (data fetching bounds)
  chartMinTick: number;
  chartMaxTick: number;
}

const LiquidityChartComponent = ({
  histogramData,
  isLoading,
  minTick, // Debounced minTick from parent (for marking active bars)
  maxTick, // Debounced maxTick from parent (for marking active bars)
  onMinTickChange, // Parent's debounced setters (will be setMinTick from LiquidityPool)
  onMaxTickChange, // Parent's debounced setters (will be setMaxTick from LiquidityPool)
  tokenDecimalsA,
  tokenDecimalsB,
  tickSpacing,
  chartMinTick, // Overall min tick for the X-axis (from leftMostTick)
  chartMaxTick, // Overall max tick for the X-axis (from rightMostTick)
}: LiquidityChartProps) => {
  // === Internal state for the slider's immediate visual updates ===
  // These will update rapidly as the slider moves
  const [sliderMinPrice, setSliderMinPrice] = useState<number>(0);
  const [sliderMaxPrice, setSliderMaxPrice] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number[]>([]);

  // Calculate the overall min/max bounds for the slider's scale
  // These are derived from the `chartMinTick` and `chartMaxTick` props,
  // which define the overall data range fetched for the histogram.
  const sliderPriceBounds = useMemo(() => {
    if (!histogramData.length || (chartMinTick === 0 && chartMaxTick === 0)) {
      // Return sensible defaults if data isn't ready or ticks are zero
      return { min: 0, max: 1000 };
    }

    // Convert the chart's overall tick range to price for the slider's bounds
    const minPossiblePrice = PriceMath.tickIndexToPrice(
      chartMinTick,
      tokenDecimalsA,
      tokenDecimalsB
    ).toNumber();
    const maxPossiblePrice = PriceMath.tickIndexToPrice(
      chartMaxTick,
      tokenDecimalsA,
      tokenDecimalsB
    ).toNumber();

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
  // when the parent's `minTick`/`maxTick` first become available (after initial load)
  // or if they change (e.g., via PriceRange input or RangeToggle)
  useEffect(() => {
    if (minTick !== 0 || maxTick !== 0) {
      // Check if valid ticks are provided
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

      setSliderMinPrice(initialMinPrice);
      setSliderMaxPrice(initialMaxPrice);
      setSliderValue([initialMinPrice, initialMaxPrice]);
    }
  }, [minTick, maxTick, tokenDecimalsA, tokenDecimalsB]); // Depends on main min/max ticks from parent

  // Debounced functions to call the parent's `onMinTickChange`/`onMaxTickChange`
  const debouncedSetParentTicks = useMemo(
    () =>
      debounce((newMinTick: number, newMaxTick: number) => {
        onMinTickChange(newMinTick);
        onMaxTickChange(newMaxTick);
        console.log(
          "Debounced update to parent (minTick/maxTick):",
          newMinTick,
          newMaxTick
        );
      }, 200), // Adjust debounce delay as needed (200-300ms)
    [onMinTickChange, onMaxTickChange] // Dependencies are the stable parent callbacks
  );

  // Handler for direct slider updates (called rapidly by MUI Slider)
  const handleSliderChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const values = newValue as number[];
      setSliderValue(values); // Update internal state immediately for smooth dragging

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

      // Store these converted ticks for the debounced update
      setSliderMinPrice(values[0]); // Update temp price displays
      setSliderMaxPrice(values[1]); // Update temp price displays

      // Call the debounced function to update the parent's state
      debouncedSetParentTicks(newMinTickConverted, newMaxTickConverted);
    },
    [debouncedSetParentTicks, tokenDecimalsA, tokenDecimalsB, tickSpacing]
  );

  // Memoize the actual chart rendering content
  const chartContent = useMemo(() => {
    // Determine the X-axis domain based on the chartMinTick/chartMaxTick props
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
            domain={[xAxisDomainMinPrice, xAxisDomainMaxPrice]} // Use calculated domain
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #46EB80",
              borderRadius: "4px",
            }}
            labelStyle={{ color: "#46EB80" }}
            formatter={(value: any) => [value.toFixed(2), "Liquidity"]}
          />
          <Bar
            dataKey="liquidity"
            fill="#46EB80"
            opacity={0.8}
            name="Liquidity (Millions)"
          >
            {/* Color cells based on the user's selected range (minTick/maxTick from props) */}
            {histogramData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.tick >= minTick && entry.tick <= maxTick
                    ? "#46EB80" // Active range color
                    : "#666666" // Inactive range color
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }, [
    histogramData,
    minTick,
    maxTick,
    chartMinTick,
    chartMaxTick,
    tokenDecimalsA,
    tokenDecimalsB,
    tickSpacing,
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
        {/* The Slider remains here, positioned absolutely */}
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          min={sliderPriceBounds.min}
          max={sliderPriceBounds.max}
          step={(sliderPriceBounds.max - sliderPriceBounds.min) / 1000} // Dynamic step based on range
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => value.toFixed(2)}
          disableSwap // Ensures min handle stays left of max handle
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

// Wrap the named component with React.memo
const MemoizedLiquidityChart = React.memo(LiquidityChartComponent);

export default MemoizedLiquidityChart;
