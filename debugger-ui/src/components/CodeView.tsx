import React, { useState } from "react";
import { Box } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewProps {
  code: string;
  highlightLine: number | null;
  breakpoints: number[];
  onToggleBreakpoint: (line: number) => void;
  errors?: number[];
}

const CodeView: React.FC<CodeViewProps> = ({
  code,
  highlightLine,
  breakpoints,
  onToggleBreakpoint,
  errors = [],
}) => {
  return (
    <Box
      sx={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#2e3440",
        color: "white",
        position: "relative",
      }}
    >
      <SyntaxHighlighter
        language="javascript"
        style={materialDark}
        showLineNumbers
        wrapLines
        lineProps={(lineNumber) => ({
          style: {
            display: "flex",
            alignItems: "center",
            backgroundColor: errors.includes(lineNumber)
              ? "#ffcccc" // Highlight error lines
              : highlightLine === lineNumber
              ? "#ffcccb" // Highlight current line
              : "transparent",
          },
          onClick: () => onToggleBreakpoint(lineNumber),
        })}
      >
        {code}
      </SyntaxHighlighter>
      <Box sx={{ position: "absolute", top: "16px", left: "8px" }}>
        {breakpoints.map((line) => (
          <div
            key={line}
            style={{
              position: "absolute",
              top: `${line * 20}px`, // Adjust height per line
              left: "-10px",
              background: "red",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default CodeView;
