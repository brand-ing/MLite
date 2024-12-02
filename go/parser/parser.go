package parser

import (
	"fmt"
	"mlite/token"
)

type Parser struct {
	tokens []token.Token
	pos    int
}

func NewParser(tokens []token.Token) *Parser {
	return &Parser{tokens: tokens}
}

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
		default:
			panic(fmt.Sprintf("Unexpected token: %s", tok.Type))
		}
	}

	return nodes
}

func (p *Parser) parseLoad() *LoadNode {
	p.expect(token.LOAD)
	p.expect(token.LPAREN)
	file := p.expect(token.STRING).Literal
	p.expect(token.RPAREN)

	return &LoadNode{File: file}
}

func (p *Parser) parseSave() *SaveNode {
	p.expect(token.SAVE)
	p.expect(token.LPAREN)
	file := p.expect(token.STRING).Literal
	p.expect(token.RPAREN)

	return &SaveNode{File: file}
}

func (p *Parser) parseTrain() *TrainNode {
	p.expect(token.TRAIN)
	p.expect(token.LPAREN)
	model := p.expect(token.STRING).Literal
	p.expect(token.COMMA)
	data := p.expect(token.IDENTIFIER).Literal
	p.expect(token.COMMA)
	target := p.expect(token.STRING).Literal
	p.expect(token.RPAREN)

	return &TrainNode{
		Model:  model,
		Data:   data,
		Target: target,
	}
}

func (p *Parser) parseSet() *SetNode {
    p.expect(token.SET)
    p.expect(token.LPAREN)
    variable := p.expect(token.IDENTIFIER).Literal
    p.expect(token.COMMA)
    value := p.expect(token.STRING).Literal
    p.expect(token.RPAREN)

    return &SetNode{
        Variable: variable,
        Value:    value,
    }
}

func (p *Parser) parseLoop() *LoopNode {
    p.expect(token.LOOP)
    p.expect(token.LPAREN)
    count := p.expect(token.IDENTIFIER, token.NUMBER).Literal
    p.expect(token.RPAREN)

    commands := p.parseBlock() // Parse the block of commands

    return &LoopNode{
        Count:    count,
        Commands: commands,
    }
}


func (p *Parser) parseIf() *IfNode {
    // Expect the "if" keyword
    p.expect(token.IF)
    p.expect(token.LPAREN)

    // Parse the left-hand side of the condition
    left := p.expect(token.IDENTIFIER, token.STRING, token.NUMBER).Literal

    // Parse the comparison operator (e.g., ==, >, <, >=, <=)
    operator := p.expect(token.EQ, token.GT, token.LT, token.GTE, token.LTE).Literal

    // Parse the right-hand side of the condition
    right := p.expect(token.IDENTIFIER, token.STRING, token.NUMBER).Literal

    p.expect(token.RPAREN)

    // Parse the block of commands enclosed in { ... }
    commands := p.parseBlock()

    // Return the IfNode representing the parsed "if" construct
    return &IfNode{
        Left:     left,
        Operator: operator,
        Right:    right,
        Commands: commands,
    }
}







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
        panic(fmt.Sprintf("Unexpected command in loop: %s", tok.Type))
    }
}

func (p *Parser) parseBlock() []Node {
    p.expect(token.LBRACE)
    var commands []Node

    for p.currentToken().Type != token.RBRACE {
        commands = append(commands, p.ParseSingleCommand())
    }

    p.expect(token.RBRACE)
    return commands
}

func (p *Parser) currentToken() token.Token {
	if p.pos >= len(p.tokens) {
		return token.Token{Type: token.EOF}
	}
	return p.tokens[p.pos]
}

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

