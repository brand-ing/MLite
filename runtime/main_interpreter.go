package main

import (
	// "fmt"
	"mlite/interpreter"
	"mlite/lexer"
	"mlite/parser"
	"mlite/token"
)

func main() {
	// Example DSL input
	input := `
	load("data.csv")
	train("linear_regression", "data.csv", "target")
	save("model_output.txt")

`



	// Step 1: Lexical Analysis (Tokenize the input)
	lex := lexer.NewLexer(input)
	tokens := []token.Token{}
	// fmt.Println("Tokens:")
	for {
		tok := lex.NextToken()
		// fmt.Printf("%+v\n", tok)
		tokens = append(tokens, tok)
		if tok.Type == token.EOF {
			break
		}
	}

	// Step 2: Parsing (Convert tokens to nodes)
	pars := parser.NewParser(tokens)
	nodes := pars.Parse()

	// Step 3: Interpretation (Execute the nodes)
	interp := interpreter.NewInterpreter()
	interp.Run(nodes)
}
