package lexer

import (
	"fmt"
	"mlite/token"
	"strings"
)

type Lexer struct {
	input string
	pos   int
}

func NewLexer(input string) *Lexer {
	return &Lexer{input: input}
}

func (l *Lexer) NextToken() token.Token {
	// fmt.Printf("Processing char: %q at position %d\n", l.input[l.pos], l.pos)
	// Skip whitespace
	for l.pos < len(l.input) && (l.input[l.pos] == ' ' || l.input[l.pos] == '\t' || l.input[l.pos] == '\n' || l.input[l.pos] == '\r') {
		l.pos++
	}

	if l.pos >= len(l.input) {
		// fmt.Println("End of input reached")
		return token.Token{Type: token.EOF}
	}

	ch := l.input[l.pos]

	switch {
	case strings.HasPrefix(l.input[l.pos:], "load") && (l.pos+4 >= len(l.input) || !isLetterOrDigit(l.input[l.pos+4])):
		l.pos += 4
		return token.Token{Type: token.LOAD, Literal: "load"}
	case strings.HasPrefix(l.input[l.pos:], "save") && (l.pos+4 >= len(l.input) || !isLetterOrDigit(l.input[l.pos+4])):
		l.pos += 4
		return token.Token{Type: token.SAVE, Literal: "save"}
	case strings.HasPrefix(l.input[l.pos:], "train") && (l.pos+5 >= len(l.input) || !isLetterOrDigit(l.input[l.pos+5])):
		l.pos += 5
		return token.Token{Type: token.TRAIN, Literal: "train"}
	case strings.HasPrefix(l.input[l.pos:], "set") && (l.pos+3 >= len(l.input) || !isLetterOrDigit(l.input[l.pos+3])):
		l.pos += 3
		return token.Token{Type: token.SET, Literal: "set"}
	case strings.HasPrefix(l.input[l.pos:], "loop") && (l.pos+4 >= len(l.input) || !isLetterOrDigit(l.input[l.pos+4])):
		l.pos += 4
		return token.Token{Type: token.LOOP, Literal: "loop"}	
	case strings.HasPrefix(l.input[l.pos:], "if") && (l.pos+2 >= len(l.input) || !isLetterOrDigit(l.input[l.pos+2])):
		l.pos += 2
		return token.Token{Type: token.IF, Literal: "if"}
	case strings.HasPrefix(l.input[l.pos:], "=="):
		l.pos += 2
		return token.Token{Type: token.EQ, Literal: "=="}
	case strings.HasPrefix(l.input[l.pos:], ">="):
		l.pos += 2
		return token.Token{Type: token.GTE, Literal: ">="}
	case strings.HasPrefix(l.input[l.pos:], "<="):
		l.pos += 2
		return token.Token{Type: token.LTE, Literal: "<="}
	case l.input[l.pos] == '>':
		l.pos++
		return token.Token{Type: token.GT, Literal: ">"}
	case l.input[l.pos] == '<':
		l.pos++
		return token.Token{Type: token.LT, Literal: "<"}			
	case ch == '(':
		l.pos++
		return token.Token{Type: token.LPAREN, Literal: "("}
	case ch == ')':
		l.pos++
		return token.Token{Type: token.RPAREN, Literal: ")"}
	case l.input[l.pos] == '{':
		l.pos++
		return token.Token{Type: token.LBRACE, Literal: "{"}
	case l.input[l.pos] == '}':
		l.pos++
		return token.Token{Type: token.RBRACE, Literal: "}"}	
	case ch == ',':
		l.pos++
		return token.Token{Type: token.COMMA, Literal: ","}
	case ch == '"':
		l.pos++ // Skip opening quote
		start := l.pos
		for l.pos < len(l.input) && l.input[l.pos] != '"' {
			l.pos++
		}
		if l.pos >= len(l.input) {
			panic(fmt.Sprintf("Unclosed string starting at position %d", start-1))
		}
		literal := l.input[start:l.pos]
		l.pos++ // Skip closing quote
		return token.Token{Type: token.STRING, Literal: literal}
	case isLetter(ch):
		literal := l.readIdentifier()
		return token.Token{Type: token.IDENTIFIER, Literal: literal}
	case isDigit(ch):
		literal := l.readNumber()
		return token.Token{Type: token.NUMBER, Literal: literal}
	default:
		panic(fmt.Sprintf("Unexpected character: %q at position %d", l.input[l.pos], l.pos))
	}

}

func (l *Lexer) readIdentifier() string {
	start := l.pos
	for l.pos < len(l.input) && (isLetter(l.input[l.pos]) || isDigit(l.input[l.pos])) {
		l.pos++
	}
	return l.input[start:l.pos]
}

func (l *Lexer) readNumber() string {
	start := l.pos
	for l.pos < len(l.input) && (isDigit(l.input[l.pos]) || l.input[l.pos] == '.') {
		l.pos++
	}
	return l.input[start:l.pos]
}

func isLetter(ch byte) bool {
	return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch == '_'
}

func isDigit(ch byte) bool {
	return ch >= '0' && ch <= '9'
}

func isLetterOrDigit(ch byte) bool {
	return isLetter(ch) || isDigit(ch)
}
