import { Box, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HistogramBin } from "../types/pool";

interface LiquidityChartProps {
  histogramData: HistogramBin[];
  isLoading: boolean;
}

export default function LiquidityChart({
  histogramData,
  isLoading,
}: LiquidityChartProps) {
  if (isLoading) {
    return null;
  }

  if (!histogramData.length) {
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
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={histogramData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="price"
            stroke="#ccc"
            fontSize={10}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#ccc" fontSize={12} />
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

      <Typography sx={{ mt: 2, fontSize: "0.8rem", color: "#ccc" }}>
        Each bar represents a price range with aggregated gross liquidity.
        Higher bars indicate more liquidity concentrated around that price
        level.
      </Typography>
    </Box>
  );
}
