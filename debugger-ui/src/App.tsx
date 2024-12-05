import React, { useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, GutterMarker } from "@codemirror/view";
import { gutter } from "@codemirror/gutter";
import { stepExecution, ExecutionState } from "./utils/ExecutionEngine";
import Controls from "./components/Controls";
import VariableInspector from "./components/VariableInspector";
import Console from "./components/Console";
import VariableGraph from "./components/VariableGraph";

class BreakpointMarker extends GutterMarker {
  toDOM() {
    const marker = document.createElement("div");
    marker.style.width = "8px";
    marker.style.height = "8px";
    marker.style.borderRadius = "50%";
    marker.style.backgroundColor = "#d32f2f"; // Red breakpoint color
    return marker;
  }
}

const App: React.FC = () => {
  const [executionState, setExecutionState] = useState<ExecutionState>({
    currentLine: 0,
    variables: [],
    logs: [],
  });

  const [code, setCode] = useState(`let x = 10;
let message = 'Hello, Debugger!';
x = x + 5;
console.log(message);
console.log(x);`);

  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [variableHistory, setVariableHistory] = useState<
    { time: number; value: number }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);

  let executionInterval: NodeJS.Timeout | null = null;

  const toggleBreakpoint = (line: number) => {
    setBreakpoints((prev) =>
      prev.includes(line) ? prev.filter((b) => b !== line) : [...prev, line]
    );
  };

  const handleStartExecution = () => {
    if (isRunning) return;
    setIsRunning(true);

    executionInterval = setInterval(() => {
      const codeLines = code.split("\n");
      setExecutionState((prevState) => {
        const nextState = stepExecution(prevState, codeLines);

        if (
          breakpoints.includes(nextState.currentLine) ||
          nextState.currentLine >= codeLines.length
        ) {
          clearInterval(executionInterval!);
          setIsRunning(false);
          alert(`Paused at breakpoint on line ${nextState.currentLine + 1}`);
          return prevState;
        }

        const progressValue = Math.min(
          (nextState.currentLine / codeLines.length) * 100,
          100
        );
        setProgress(progressValue);

        const xValue = nextState.variables.find((v) => v.name === "x")?.value;
        if (typeof xValue === "number") {
          setVariableHistory((prev) => [
            ...prev,
            { time: nextState.currentLine, value: xValue },
          ]);
        }

        return nextState;
      });
    }, 1000);
  };

  const handleStopExecution = () => {
    setIsRunning(false);
    if (executionInterval) clearInterval(executionInterval);
  };

  const handleClearBreakpoints = () => setBreakpoints([]);

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
        onStepInto={() => console.log("Step Into")}
        onStepOver={() => console.log("Step Over")}
        onStepOut={() => console.log("Step Out")}
        onClearBreakpoints={handleClearBreakpoints}
        onReset={() => console.log("Reset")}
        onLoadState={() => console.log("Load State")}
        onSaveState={() => console.log("Save State")}
        onResume={() => console.log("Resume")}
        isRunning={isRunning}
        errorDetails={null}
      />
      <Box sx={{ display: "flex", gap: "16px", padding: "16px" }}>
        <Box sx={{ flex: 2 }}>
          <CodeMirror
            value={code}
            extensions={[
              javascript(),
              gutter({
                class: "cm-breakpoints",
                lineMarker(view, line, otherMarkers) {
                  const fromLine = view.state.doc.lineAt(line.from).number;
                  return breakpoints.includes(fromLine)
                    ? new BreakpointMarker()
                    : null;
                },
                domEventHandlers: {
                  mousedown(view, line, event) {
                    if (event instanceof MouseEvent) {
                      const fromLine = view.state.doc.lineAt(line.from).number;
                      toggleBreakpoint(fromLine);
                    }
                    return true;
                  },
                },
              }),
            ]}
            onChange={(value) => setCode(value)}
            theme="dark"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <VariableInspector variables={executionState.variables} />
        </Box>
      </Box>
      <Box sx={{ padding: "16px" }}>
        <Console logs={executionState.logs} />
      </Box>
      <Box sx={{ padding: "16px" }}>
        <VariableGraph data={variableHistory} label="Value of x" />
      </Box>
    </Box>
  );
};

export default App;
