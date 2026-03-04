package lexer

import (
	"mlite/token"
	"testing"
)

func TestNextToken(t *testing.T) {
	input := `load("data.csv") save("output.csv")`

	expectedTokens := []token.Token{
		{Type: token.LOAD, Literal: "load"},
		{Type: token.LPAREN, Literal: "("},
		{Type: token.STRING, Literal: "data.csv"},
		{Type: token.RPAREN, Literal: ")"},
		{Type: token.SAVE, Literal: "save"},
		{Type: token.LPAREN, Literal: "("},
		{Type: token.STRING, Literal: "output.csv"},
		{Type: token.RPAREN, Literal: ")"},
		{Type: token.EOF, Literal: ""},
	}

	lex := NewLexer(input)

	for i, expected := range expectedTokens {
		tok := lex.NextToken()

		if tok.Type != expected.Type {
			t.Fatalf("test[%d] - Token type wrong. expected=%q, got=%q",
				i, expected.Type, tok.Type)
		}

		if tok.Literal != expected.Literal {
			t.Fatalf("test[%d] - Token literal wrong. expected=%q, got=%q",
				i, expected.Literal, tok.Literal)
		}
	}
}


func TestIdentifier(t *testing.T) {
    input := "data"
    lex := NewLexer(input)
    tok := lex.NextToken()

    if tok.Type != token.IDENTIFIER {
        t.Fatalf("expected IDENTIFIER, got %s", tok.Type)
    }

    if tok.Literal != "data" {
        t.Fatalf("expected 'data', got %s", tok.Literal)
    }
}
