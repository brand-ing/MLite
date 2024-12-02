import React from "react";
import { Box, Button, Stack } from "@mui/material";

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  onStepInto: () => void;
  onStepOver: () => void;
  onStepOut: () => void;
  onClearBreakpoints: () => void;
  onReset: () => void;
  onSaveState: () => void;
  onLoadState: () => void;
  onResume: () => void;
  isRunning: boolean;
  errorDetails: string | null;
}

const Controls: React.FC<ControlsProps> = ({
  onStart,
  onStop,
  onStepInto,
  onStepOver,
  onStepOut,
  onClearBreakpoints,
  onReset,
  onSaveState,
  onLoadState,
  onResume,
  isRunning,
  errorDetails,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        backgroundColor: "#f5f5f5",
        borderTop: "1px solid #ddd",
      }}
    >
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="success"
          onClick={onStart}
          disabled={isRunning} // Disable if already running
        >
          Start
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onStop}
          disabled={!isRunning} // Disable if not running
        >
          Stop
        </Button>
        <Button variant="outlined" onClick={onStepInto} disabled={isRunning}>
          Step Into
        </Button>
        <Button variant="outlined" onClick={onStepOver} disabled={isRunning}>
          Step Over
        </Button>
        <Button variant="outlined" onClick={onStepOut}>
          Step Out
        </Button>
        <Button variant="outlined" color="warning" onClick={onClearBreakpoints}>
          Clear Breakpoints
        </Button>
        <Button variant="contained" color="secondary" onClick={onReset}>
          Reset
        </Button>
        <Button variant="outlined" onClick={onSaveState}>
          Save
        </Button>
        <Button variant="outlined" onClick={onLoadState}>
          Load
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onResume}
          disabled={!errorDetails}
        >
          Resume
        </Button>
      </Stack>
    </Box>
  );
};

export default Controls;
