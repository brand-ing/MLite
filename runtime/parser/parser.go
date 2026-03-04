package parser

import (
    "fmt"
    "mlite/token"
)

const (
    LOWEST = 0

    LITERAL    = "LITERAL"
    IDENTIFIER = "IDENTIFIER"
)

type Parser struct {
    tokens []token.Token
    pos    int
}

// NewParser creates a new parser
func NewParser(tokens []token.Token) *Parser {
    return &Parser{tokens: tokens}
}

func (p *Parser) parseExpression(precedence int) *ExpressionNode {
    switch p.currentToken().Type {
    case token.NUMBER:
        return &ExpressionNode{Type: LITERAL, Value: p.expect(token.NUMBER).Literal}
    case token.IDENTIFIER:
        return &ExpressionNode{Type: IDENTIFIER, Value: p.expect(token.IDENTIFIER).Literal}
    default:
        panic(fmt.Sprintf("Unexpected token: %s", p.currentToken().Literal))
    }
}

// Other methods...

// Parse parses the tokens into a list of nodes
func (p *Parser) Parse() []Node {
	var nodes []Node

	for p.pos < len(p.tokens) {
		tok := p.currentToken()

		if tok.Type == token.EOF {
			break
		}

		switch tok.Type {
		case token.LOAD:
			nodes = append(nodes, p.parseLoad())
		case token.SAVE:
			nodes = append(nodes, p.parseSave())
		case token.TRAIN:
			nodes = append(nodes, p.parseTrain())
		case token.SET:
			nodes = append(nodes, p.parseSet())
		case token.LOOP:
			nodes = append(nodes, p.parseLoop())
		case token.IF:
			nodes = append(nodes, p.parseIf())
		case token.LET:
			nodes = append(nodes, p.parseLetStatement())
		default:
			panic(fmt.Sprintf("Unexpected token: %s", tok.Type))
		}
	}

	return nodes
}

// Parse "let" statements
func (p *Parser) parseLetStatement() *LetNode {
	p.expect(token.LET)
	variable := p.expect(token.IDENTIFIER).Literal

	p.expect(token.ASSIGN)
	value := p.parseExpression(LOWEST)

	p.expect(token.SEMICOLON)

	return &LetNode{
		Variable: variable,
		Value:    value,
	}
}



// Parse blocks enclosed in braces
func (p *Parser) parseBlock() []Node {
	p.expect(token.LBRACE)
	var commands []Node

	for p.currentToken().Type != token.RBRACE {
		commands = append(commands, p.ParseSingleCommand())
	}

	p.expect(token.RBRACE)
	return commands
}

// Helper to parse single commands
func (p *Parser) ParseSingleCommand() Node {
	tok := p.currentToken()
	switch tok.Type {
	case token.TRAIN:
		return p.parseTrain()
	case token.SAVE:
		return p.parseSave()
	case token.LOAD:
		return p.parseLoad()
	case token.IF:
		return p.parseIf()
	default:
		panic(fmt.Sprintf("Unexpected command in block: %s", tok.Type))
	}
}

// Parse "load" commands
func (p *Parser) parseLoad() *LoadNode {
	p.expect(token.LOAD)
	p.expect(token.LPAREN)
	file := p.expect(token.STRING).Literal
	p.expect(token.RPAREN)

	return &LoadNode{File: file}
}

// Parse "save" commands
func (p *Parser) parseSave() *SaveNode {
	p.expect(token.SAVE)
	p.expect(token.LPAREN)
	file := p.expect(token.STRING).Literal
	p.expect(token.RPAREN)

	return &SaveNode{File: file}
}

// Parse "train" commands
func (p *Parser) parseTrain() *TrainNode {
    p.expect(token.TRAIN)
    p.expect(token.LPAREN)

    model := p.expect(token.IDENTIFIER).Literal
    p.expect(token.COMMA)

    features := p.expect(token.IDENTIFIER).Literal
    p.expect(token.COMMA)

    target := p.expect(token.IDENTIFIER).Literal
    p.expect(token.RPAREN)

    return &TrainNode{
        Model:    model,
        Features: features,
        Target:   target,
    }
}

func (p *Parser) parsePredict() *PredictNode {
    p.expect(token.PREDICT)
    p.expect(token.LPAREN)

    model := p.expect(token.IDENTIFIER).Literal
    p.expect(token.COMMA)

    input := parseArray(p) // Parse the input array
    p.expect(token.RPAREN)

    return &PredictNode{
        Model: model,
        Input: input,
    }
}


// Parse "if" statements
func (p *Parser) parseIf() *IfNode {
	p.expect(token.IF)
	p.expect(token.LPAREN)

	left := p.parseExpression(LOWEST)
	operator := p.expect(token.EQ, token.GT, token.LT, token.GTE, token.LTE).Literal
	right := p.parseExpression(LOWEST)

	p.expect(token.RPAREN)

	commands := p.parseBlock()

	return &IfNode{
		Left:     left,
		Operator: operator,
		Right:    right,
		Commands: commands,
	}
}


// Parse "set" commands
func (p *Parser) parseSet() *SetNode {
    p.expect(token.SET)                       // Expect the "set" keyword
    p.expect(token.LPAREN)                   // Expect an opening parenthesis
    variable := p.expect(token.IDENTIFIER).Literal // Parse the variable name

    p.expect(token.COMMA)                    // Expect a comma
    value := p.parseExpression(LOWEST)       // Parse the value as an ExpressionNode

    p.expect(token.RPAREN)                   // Expect a closing parenthesis

    return &SetNode{
        Variable: variable, // The variable name as a string
        Value:    value,    // The value as an *ExpressionNode
    }
}


// Parse "loop" commands
func (p *Parser) parseLoop() *LoopNode {
    p.expect(token.LOOP)
    p.expect(token.LPAREN)
    count := p.parseExpression(LOWEST) // Parse the count as an ExpressionNode

    p.expect(token.RPAREN)
    commands := p.parseBlock()

    return &LoopNode{
        Count:    count, // count is now *ExpressionNode
        Commands: commands,
    }
}

// Current token helper
func (p *Parser) currentToken() token.Token {
	if p.pos >= len(p.tokens) {
		return token.Token{Type: token.EOF}
	}
	return p.tokens[p.pos]
}

// Expect token helper
func (p *Parser) expect(expectedTypes ...token.TokenType) token.Token {
	tok := p.currentToken()
	for _, expectedType := range expectedTypes {
		if tok.Type == expectedType {
			p.pos++
			return tok
		}
	}
	panic(fmt.Sprintf("Syntax error: expected one of %v, got %s", expectedTypes, tok.Type))
}
