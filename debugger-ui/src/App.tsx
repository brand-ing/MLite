import React, { useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import Controls from "./components/Controls";
import VariableInspector from "./components/VariableInspector";
import Console from "./components/Console";
import VariableGraph from "./components/VariableGraph";
import { stepExecution, ExecutionState } from "./utils/ExecutionEngine";

const App: React.FC = () => {
  // Execution State
  const [executionState, setExecutionState] = useState<ExecutionState>({
    currentLine: 0,
    variables: [
      { name: "x", type: "number", value: 10 },
      { name: "message", type: "string", value: "Hello, Debugger!" },
      { name: "isRunning", type: "boolean", value: false },
    ],
    logs: [],
  });

  // Editable Code State
  const [code, setCode] = useState(`let x = 10;
let message = 'Hello, Debugger!';
x = x + 5;
console.log(message);
console.log(x);`);

  // Progress Bar State
  const [progress, setProgress] = useState(0);

  // Variable Graph State
  const [variableHistory, setVariableHistory] = useState<
    { time: number; value: number }[]
  >([]);

  // Breakpoints
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  // Running State
  const [isRunning, setIsRunning] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  let executionInterval: NodeJS.Timeout | null = null;

  // Step Into Execution
  const handleStepInto = () => {
    const codeLines = code.split("\n");
    setExecutionState((prevState) => {
      const nextState = stepExecution(prevState, codeLines);

      // Check for errors
      const lastLog = nextState.logs[nextState.logs.length - 1];
      if (lastLog?.startsWith("Error")) {
        setErrorDetails(lastLog); // Set error details
      } else {
        setErrorDetails(null); // Clear error details if resolved
      }

      return nextState;
    });
  };

  // Start Automatic Execution
  const handleStartExecution = () => {
    if (isRunning) return;
    setIsRunning(true);

    executionInterval = setInterval(() => {
      const codeLines = code.split("\n");
      setExecutionState((prevState) => {
        const nextState = stepExecution(prevState, codeLines);

        // Stop at breakpoints or end of program
        if (
          breakpoints.includes(nextState.currentLine) ||
          nextState.currentLine >= codeLines.length
        ) {
          clearInterval(executionInterval!);
          setIsRunning(false);
        }

        // Update progress
        const progressValue = Math.min(
          (nextState.currentLine / codeLines.length) * 100,
          100
        );
        setProgress(progressValue);

        // Track variable 'x' history
        const xValue = nextState.variables.find((v) => v.name === "x")?.value;
        if (typeof xValue === "number") {
          setVariableHistory((prev) => [
            ...prev,
            { time: nextState.currentLine, value: xValue },
          ]);
        }

        return nextState;
      });
    }, 1000); // 1-second interval
  };

  // Stop Execution
  const handleStopExecution = () => {
    setIsRunning(false);
    if (executionInterval) clearInterval(executionInterval);
  };

  // Clear Breakpoints
  const handleClearBreakpoints = () => setBreakpoints([]);

  // Reset Debugger
  const handleReset = () => {
    if (executionInterval) {
      clearInterval(executionInterval);
      executionInterval = null;
    }
    setExecutionState({
      currentLine: 0,
      variables: [
        { name: "x", type: "number", value: 10 },
        { name: "message", type: "string", value: "Hello, Debugger!" },
        { name: "isRunning", type: "boolean", value: false },
      ],
      logs: [],
    });
    setProgress(0);
    setVariableHistory([]);
    setBreakpoints([]);
    setIsRunning(false);
  };

  const handleSaveState = () => {
    const stateToSave = { executionState, code };
    localStorage.setItem("debuggerState", JSON.stringify(stateToSave));
    console.log("State saved!");
  };

  const handleLoadState = () => {
    const savedState = localStorage.getItem("debuggerState");
    if (savedState) {
      const { executionState, code } = JSON.parse(savedState);
      setExecutionState(executionState);
      setCode(code);
      console.log("State loaded!");
    } else {
      console.log("No saved state found.");
    }
  };

  const handleResume = () => {
    setErrorDetails(null); // Clear error details
    handleStepInto(); // Resume execution
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ padding: "16px" }}>
        Debugger
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ margin: "16px 0" }}
      />
      <Controls
        onStart={handleStartExecution}
        onStop={handleStopExecution}
        onStepInto={handleStepInto}
        onStepOver={handleStepInto}
        onStepOut={() => console.log("Step Out")}
        onClearBreakpoints={handleClearBreakpoints}
        onReset={handleReset}
        onLoadState={handleLoadState}
        onSaveState={handleSaveState}
        onResume={handleResume}
        isRunning={isRunning}
        errorDetails={errorDetails}
      />
      <Box sx={{ display: "flex", gap: "16px", padding: "16px" }}>
        <Box sx={{ flex: 2 }}>
          <CodeMirror
            value={code}
            extensions={[javascript()]}
            onChange={(value) => setCode(value)}
            theme="dark"
            style={{
              border: errorDetails ? "2px solid red" : "2px solid transparent",
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <VariableInspector variables={executionState.variables} />
        </Box>
      </Box>
      <Box sx={{ padding: "16px" }}>
        <Console logs={[...executionState.logs, errorDetails || ""]} />
      </Box>
      <Box sx={{ padding: "16px" }}>
        <VariableGraph data={variableHistory} label="Value of x" />
      </Box>
    </Box>
  );
};

export default App;
