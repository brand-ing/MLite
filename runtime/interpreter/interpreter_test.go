package interpreter

import (
	"mlite/parser"
	"testing"
)

func TestInterpreter_Run(t *testing.T) {
    nodes := []parser.Node{
        &parser.LoadNode{File: "data.csv"},
        &parser.SaveNode{File: "output.csv"},
    }

    interp := NewInterpreter(nodes)
    interp.Run()
    // Verify the output manually or use mocks/logging to validate actions
}
