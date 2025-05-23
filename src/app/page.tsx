import { Box, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#070D0AE5",
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
          fontWeight: "bold",
          textAlign: "center",
          color: "#46EB80",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        Let the exam begin. Good luck!
      </Typography>
    </Box>
  );
}
