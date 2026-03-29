//go:build server
// Build with: go build -tags server

package main

import (
	"encoding/json"
	"fmt"
	"mlite/lexer"
	"mlite/parser"
	"mlite/token"
	"mlite/transpiler"
	"net/http"
)

// Request is the JSON body the workbench sends us.
// The Code field contains raw MLite source code.
type Request struct {
	Code string `json:"code"`
}

// Response is what we send back.
// On success: Python is populated.
// On failure: Error is populated and Python is empty.
type Response struct {
	Python string `json:"python,omitempty"`
	Error  string `json:"error,omitempty"`
}

// handleTranspile is the core endpoint.
// It runs the full pipeline: MLite source → tokens → AST → Python source.
func handleTranspile(w http.ResponseWriter, r *http.Request) {
	// Step 0: only accept POST
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Step 1: decode the incoming JSON body
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Code == "" {
		writeError(w, "code field is empty", http.StatusBadRequest)
		return
	}

	// Step 2: Lex — turn the MLite source string into a token slice.
	// The lexer produces one token at a time, so we loop until EOF.
	lex := lexer.NewLexer(req.Code)
	var tokens []token.Token
	for {
		tok := lex.NextToken()
		tokens = append(tokens, tok)
		if tok.Type == token.EOF {
			break
		}
	}

	// Step 3: Parse — turn the token slice into an AST ([]parser.Node).
	// We use recover() here because the parser panics on syntax errors.
	// A real production server would return a proper error message instead.
	var nodes []parser.Node
	var parseErr string
	func() {
		defer func() {
			if r := recover(); r != nil {
				parseErr = fmt.Sprintf("syntax error: %v", r)
			}
		}()
		p := parser.NewParser(tokens)
		nodes = p.Parse()
	}()

	if parseErr != "" {
		writeError(w, parseErr, http.StatusBadRequest)
		return
	}

	// Step 4: Transpile — walk the AST and emit Python source code.
	var pythonCode string
	var transpileErr string
	func() {
		defer func() {
			if r := recover(); r != nil {
				transpileErr = fmt.Sprintf("transpile error: %v", r)
			}
		}()
		t := transpiler.NewTranspiler()
		pythonCode = t.Transpile(nodes)
	}()

	if transpileErr != "" {
		writeError(w, transpileErr, http.StatusInternalServerError)
		return
	}

	// Step 5: return the Python source as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{Python: pythonCode})
}

// writeError sends a JSON error response with the given HTTP status code.
func writeError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{Error: msg})
}

// enableCors wraps any handler and adds the headers that allow
// the workbench (running on a different port) to call this API.
func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		// OPTIONS is a preflight check browsers send before the real request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// handleHealth responds to GET /health so the UI can poll server status.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/transpile", handleTranspile)
	mux.HandleFunc("/health", handleHealth)
	// Catch-all: any unknown route still gets CORS headers so the browser
	// doesn't report a misleading "CORS header missing" error on 404s.
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, "not found", http.StatusNotFound)
	})

	fmt.Println("MLite server running on http://localhost:8081")
	fmt.Println("POST /transpile  — send MLite code, receive Python")
	fmt.Println("GET  /health     — server status check")
	http.ListenAndServe(":8081", enableCors(mux))
}