# A Machine Learning Interpreter for Everyone

Overview: Why am I building this?
Lite Source Code  →  [Lexer]  →  [Parser]  →  [Interpreter/Transpiler]  →  Python

The Learning Roadmap
We'll go through this in stages. Each stage has a concept, a challenge you build, and interview talking points.


Stage 1 → Tokens & the Lexer       ← YOU ARE HERE
Stage 2 → The Parser & AST
Stage 3 → The Transpiler (→ Python)
Stage 4 → Wiring to the Server/UI

Building an Interpreter
Lexer
Parser
Executor

Building WorkBench
The debugger

Development
Phase 1 (now) → file-based — get the interpreter outputting trace.json
Phase 2 (soon) → HTTP server — wire workbench's RUN button to the Go API  
Phase 3 (later) → WebSocket — stream steps live for the full debugger feel
