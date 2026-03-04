import React from "react";
import { Box, Typography } from "@mui/material";

interface ConsoleProps {
  logs: string[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
  return (
    <Box
      sx={{
        padding: "16px",
        backgroundColor: "#2e3440",
        color: "white",
        border: "1px solid #ddd",
        borderRadius: "4px",
        maxHeight: "200px",
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Console Output
      </Typography>
      <Box
        sx={{
          fontFamily: "monospace",
          fontSize: "14px",
          whiteSpace: "pre-wrap",
        }}
      >
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </Box>
    </Box>
  );
};

export default Console;
