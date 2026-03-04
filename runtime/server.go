//go:build server

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	// "strings"
	"go/interpreter"
	"go/lexer"
	"go/parser"
)

type Request struct {
	Code string `json:"code"` // Custom syntax from the debugger
}

type Response struct {
    Output    string                 `json:"output"`
    Variables map[string]interface{} `json:"variables,omitempty"`
    Error     string                 `json:"error,omitempty"`
}


var variables = make(map[string]interface{}) // Global map to store variables

func translateToPython(code string) string {
    fmt.Println("Translating to Python:", code) // Log incoming custom syntax
    return code // For now, just return the same code (adjust as needed)
}


func executePython(pythonCode string) string {
    cmd := exec.Command("python3", "-c", pythonCode)
    output, err := cmd.CombinedOutput()
    if err != nil {
        panic(fmt.Sprintf("Python execution failed: %s", err))
    }
    return string(output)
}

func checkPythonDependencies() {
    cmd := exec.Command("python3", "-m", "pip", "list")
    output, err := cmd.CombinedOutput()
    if err != nil || !strings.Contains(string(output), "scikit-learn") {
        panic("Required Python libraries are missing. Run: pip install -r requirements.txt")
    }
}


func handleExecution(w http.ResponseWriter, r *http.Request) {
    var req Request
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    // Tokenize and parse the input code
    lexer := lexer.NewLexer(req.Code)
    parser := parser.NewParser(lexer)
    program := parser.ParseProgram() // Generate the AST

    // Execute the program (interprets the AST)
    executeProgram(program)

    // Return the updated variables and any output
    resp := Response{
        Variables: variables,
        Output:    "Execution finished.", // Add output as needed
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}

func handleStep(w http.ResponseWriter, r *http.Request) {
    var req Request
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    // Parse and step execute
    lexer := lexer.NewLexer(req.Code)
    parser := parser.NewParser(lexer)
    nodes := parser.ParseProgram()

    if req.CurrentNode >= len(nodes) {
        http.Error(w, "No more nodes to execute", http.StatusBadRequest)
        return
    }

    interpreter := NewInterpreter()
    interpreter.StepRun(nodes[req.CurrentNode])

    // Respond with the current state
    resp := Response{
        Variables: interpreter.variables,
        Output:    fmt.Sprintf("Executed node %d", req.CurrentNode),
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}


func enableCors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
        w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK) // Handle preflight request
            return
        }
        next.ServeHTTP(w, r)
    })
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/execute", handleExecution)

    fmt.Println("Interpreter server running on http://localhost:8080")
    http.ListenAndServe(":8080", enableCors(mux))
}
