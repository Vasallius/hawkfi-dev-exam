"use client";
import { Box } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorBoundary } from "react-error-boundary";
import LiquidityPool from "../components/LiquidityPool";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Box
      sx={{
        p: 3,
        color: "error.main",
        textAlign: "center",
      }}
    >
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </Box>
  );
}

export default function Home() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Box
          sx={{
            minHeight: "100vh",
            backgroundColor: "#070D0AE5",
            color: "white",
            p: 3,
          }}
        >
          <LiquidityPool />
        </Box>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
