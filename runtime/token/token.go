package token

type TokenType string

type Token struct {
	Type    TokenType
	Literal string
}

const (
	LOWEST 		 int = iota // Lowest precedence
	ILLEGAL TokenType = "ILLEGAL"
	EOF     TokenType = "EOF"

	// Symbols
	COMMA  TokenType = "COMMA"
	LPAREN TokenType = "LPAREN"
	RPAREN TokenType = "RPAREN"
	LBRACE TokenType = "LBRACE" // {
	RBRACE TokenType = "RBRACE" // }
	EQ     TokenType = "EQ"
	GT  TokenType = "GT"  // Greater than
    LT  TokenType = "LT"  // Less than
    GTE TokenType = "GTE" // Greater than or equal to
    LTE TokenType = "LTE" // Less than or equal to
	ASSIGN TokenType = "ASSIGN" // Double colon for assignment (::)
    SEMICOLON TokenType = "SEMICOLON" // Semicolon for statement termination (;)
	

	// Types
	IDENTIFIER TokenType = "IDENTIFIER"
	STRING     TokenType = "STRING"
	NUMBER     TokenType = "NUMBER"
	// Keywords
	LOAD  TokenType = "LOAD"
	SAVE  TokenType = "SAVE"
	TRAIN  TokenType = "TRAIN"
	SET    TokenType = "SET"
	LOOP   TokenType = "LOOP"
	IF     TokenType = "IF"
	LET       TokenType = "LET"       
)
