"use client";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: "transparent",
  gap: 0,
  padding: 0,
  height: 48,
  "& .MuiToggleButtonGroup-grouped": {
    margin: 0,
    border: "1px solid #333333",
    height: "48px",
    borderRadius: "24px",
    "&.Mui-selected": {
      backgroundColor: "#1A1A1A",
      color: "#FFFFFF",
      border: `1px solid ${theme.palette.success.main}`,
      "&:hover": {
        backgroundColor: "#1A1A1A",
      },
    },
    "&:not(.Mui-selected)": {
      backgroundColor: "#2A2A2A",
      color: "rgba(255, 255, 255, 0.7)",
      border: "1px solid #333333",
      "&:hover": {
        backgroundColor: "#2A2A2A",
      },
    },
  },
}));

const StyledToggleButton = styled(ToggleButton)({
  width: "100%",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "0 24px",
  lineHeight: "24px",
});

interface RangeToggleProps {
  value: "customRange" | "fullRange";
  onChange: (value: "customRange" | "fullRange") => void;
}

export default function RangeToggle({ value, onChange }: RangeToggleProps) {
  const handleChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: "customRange" | "fullRange" | null
  ) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <StyledToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="Segmented Button Group"
      fullWidth
    >
      <StyledToggleButton value="customRange">Custom Range</StyledToggleButton>
      <StyledToggleButton value="fullRange">Full Range</StyledToggleButton>
    </StyledToggleButtonGroup>
  );
}
