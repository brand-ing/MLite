package parser

import (
	"mlite/token"
	"testing"
)

func TestParse(t *testing.T) {
	tokens := []token.Token{
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

	parser := NewParser(tokens)
	nodes := parser.Parse()

	if len(nodes) != 2 {
		t.Fatalf("expected 2 nodes, got %d", len(nodes))
	}

	loadNode, ok := nodes[0].(*LoadNode)
	if !ok || loadNode.File != "data.csv" {
		t.Fatalf("expected LoadNode with File 'data.csv', got %+v", loadNode)
	}

	saveNode, ok := nodes[1].(*SaveNode)
	if !ok || saveNode.File != "output.csv" {
		t.Fatalf("expected SaveNode with File 'output.csv', got %+v", saveNode)
	}
}


func TestTrainNode(t *testing.T) {
    tokens := []token.Token{
        {Type: token.TRAIN, Literal: "train"},
        {Type: token.LPAREN, Literal: "("},
        {Type: token.STRING, Literal: "linear_regression"},
        {Type: token.COMMA, Literal: ","},
        {Type: token.IDENTIFIER, Literal: "data"},
        {Type: token.COMMA, Literal: ","},
        {Type: token.STRING, Literal: "price"},
        {Type: token.RPAREN, Literal: ")"},
        {Type: token.EOF, Literal: ""},
    }

    parser := NewParser(tokens)
    nodes := parser.Parse()

    if len(nodes) != 1 {
        t.Fatalf("expected 1 node, got %d", len(nodes))
    }

    trainNode, ok := nodes[0].(*TrainNode)
    if !ok || trainNode.Model != "linear_regression" || trainNode.Features[0] != "data" || trainNode.Target != "price" {
        t.Fatalf("unexpected TrainNode: %+v", trainNode)
    }
}

func TestParsePredict(t *testing.T) {
	tokens := []token.Token{
		{Type: token.PREDICT, Literal: "predict"},
		{Type: token.LPAREN, Literal: "("},
		{Type: token.IDENTIFIER, Literal: "myModel"},
		{Type: token.COMMA, Literal: ","},
		{Type: token.LBRACKET, Literal: "["},
		{Type: token.NUMBER, Literal: "1.5"},
		{Type: token.COMMA, Literal: ","},
		{Type: token.NUMBER, Literal: "2.0"},
		{Type: token.RBRACKET, Literal: "]"},
		{Type: token.RPAREN, Literal: ")"},
		{Type: token.EOF, Literal: ""},
	}

	p := NewParser(tokens)
	nodes := p.Parse()

	if len(nodes) != 1 {
		t.Fatalf("expected 1 node, got %d", len(nodes))
	}
	predict, ok := nodes[0].(*PredictNode)
	if !ok {
		t.Fatalf("expected *PredictNode, got %T", nodes[0])
	}
	if predict.Model != "myModel" {
		t.Errorf("expected model 'myModel', got '%s'", predict.Model)
	}
	if len(predict.Input) != 2 || predict.Input[0] != 1.5 || predict.Input[1] != 2.0 {
		t.Errorf("unexpected input: %v", predict.Input)
	}
}

func TestFullCommand(t *testing.T) {
    input := []token.Token{
        {Type: token.LOAD, Literal: "load"},
        {Type: token.LPAREN, Literal: "("},
        {Type: token.STRING, Literal: "data.csv"},
        {Type: token.RPAREN, Literal: ")"},
        {Type: token.TRAIN, Literal: "train"},
        {Type: token.LPAREN, Literal: "("},
        {Type: token.STRING, Literal: "linear_regression"},
        {Type: token.COMMA, Literal: ","},
        {Type: token.IDENTIFIER, Literal: "data"},
        {Type: token.COMMA, Literal: ","},
        {Type: token.STRING, Literal: "price"},
        {Type: token.RPAREN, Literal: ")"},
        {Type: token.SAVE, Literal: "save"},
        {Type: token.LPAREN, Literal: "("},
        {Type: token.STRING, Literal: "output.csv"},
        {Type: token.RPAREN, Literal: ")"},
        {Type: token.EOF, Literal: ""},
    }

    parser := NewParser(input)
    nodes := parser.Parse()

    if len(nodes) != 3 {
        t.Fatalf("expected 3 nodes, got %d", len(nodes))
    }
}
