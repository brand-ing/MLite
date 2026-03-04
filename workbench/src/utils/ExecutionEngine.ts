import { evaluate } from "mathjs";

type Variable = { name: string; type: string; value: any };

export interface ExecutionState {
    currentLine: number;
    variables: Variable[];
    logs: string[];
}

export const codeLines = [
    "let x = 10;",
    "let message = 'Hello, Debugger!';",
    "x = x + 5;",
    "console.log(message);",
    "undefinedVar = 5;", // Deliberate error
    "console.log(x);",
];

export const stepExecution = (
    state: ExecutionState,
    codeLines: string[]
): ExecutionState => {
    const { currentLine, variables, logs } = state;

    if (currentLine >= codeLines.length) {
        return { ...state, logs: [...logs, "Execution finished."] };
    }

    const currentCode = codeLines[currentLine];
    let newVariables = [...variables];
    let newLogs = [...logs];
    let error = null;

    try {
        // Handle console.log
        if (currentCode.includes("console.log")) {
            const logExpression = currentCode.match(/console.log\((.+)\)/)?.[1];
            if (logExpression) {
                const resolvedLog = evaluateExpression(logExpression, variables);
                newLogs.push(String(resolvedLog));
            }
        }

        // Handle variable assignments
        if (currentCode.includes("let ") || currentCode.includes("=")) {
            const match = currentCode.match(/(let )?(\w+)\s*=\s*(.+);/);
            if (match) {
                const [, , variableName, valueExpression] = match;
                const newValue = evaluateExpression(valueExpression, variables);

                newVariables = newVariables.map((v) =>
                    v.name === variableName
                        ? { ...v, value: newValue }
                        : v
                );
                if (!newVariables.find((v) => v.name === variableName)) {
                    newVariables.push({
                        name: variableName,
                        type: typeof newValue,
                        value: newValue,
                    });
                }
            }
        }
    } catch (err) {
        if (err instanceof Error) {
            error = `Error at line ${currentLine + 1}: ${err.message}`;
        } else {
            error = `Error at line ${currentLine + 1}: Unknown error occurred.`;
        }
        newLogs.push(error);
    }

    return {
        currentLine: error ? currentLine : currentLine + 1,
        variables: newVariables,
        logs: newLogs,
    };
};

// Helper function using mathjs
const evaluateExpression = (expression: string, variables: Variable[]): any => {
    const scope = variables.reduce((acc, variable) => {
        acc[variable.name] = variable.value;
        return acc;
    }, {} as Record<string, any>);

    try {
        return evaluate(expression, scope); // Safe evaluation
    } catch (error) {
        throw new Error(`Invalid expression: ${expression}`);
    }
};
