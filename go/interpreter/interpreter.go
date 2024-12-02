package interpreter

import (
	"fmt"
	"mlite/parser"
	"strconv"
)


type Interpreter struct{
    variables map[string]string

}

func NewInterpreter() *Interpreter {
	return &Interpreter{variables: make(map[string]string)}
}

func toFloat(value string) float64 {
    f, err := strconv.ParseFloat(value, 64)
    if err != nil {
        panic(fmt.Sprintf("Cannot convert '%s' to a float", value))
    }
    return f
}

func (i *Interpreter) Run(nodes []parser.Node) {
	for _, node := range nodes {
		switch n := node.(type) {
		case *parser.SetNode:
            i.variables[n.Variable] = n.Value
            fmt.Printf("Set variable %s = %s\n", n.Variable, n.Value)
		case *parser.LoadNode:
			fmt.Printf("Loading file: %s\n", n.File)
			executePython("load.py", n.File)
		case *parser.SaveNode:
			fmt.Printf("Saving to file: %s\n", n.File)
			executePython("save.py", n.File)
		case *parser.TrainNode:
			fmt.Printf("Training model: %s on data: %s with target: %s\n", n.Model, n.Data, n.Target)
			executePython("train.py", n.Model, n.Data, n.Target)
		case *parser.LoopNode:
			// Resolve count (check if it's a variable)
			countStr := n.Count
			if val, ok := i.variables[countStr]; ok {
				countStr = val
			}
			count, err := strconv.Atoi(countStr)
			if err != nil {
				panic(fmt.Sprintf("Invalid loop count: %s", countStr))
			}
		
			// Execute the command repeatedly
			for j := 0; j < count; j++ {
				fmt.Printf("Iteration %d of %d\n", j+1, count)
				i.Run(n.Commands) // Execute all of the commands
			}
		case *parser.IfNode:
			left := n.Left
			right := n.Right
		
			// Resolve variables
			if val, ok := i.variables[left]; ok {
				left = val
			}
			if val, ok := i.variables[right]; ok {
				right = val
			}
		
			// Evaluate comparison
			condition := false
			switch n.Operator {
			case "==":
				condition = (left == right)
			case ">":
				condition = (toFloat(left) > toFloat(right))
			case "<":
				condition = (toFloat(left) < toFloat(right))
			case ">=":
				condition = (toFloat(left) >= toFloat(right))
			case "<=":
				condition = (toFloat(left) <= toFloat(right))
			default:
				panic(fmt.Sprintf("Unsupported operator: %s", n.Operator))
			}
		
			// Execute command if condition is true
			if condition {
				fmt.Printf("Condition '%s %s %s' is true; executing command.\n", n.Left, n.Operator, n.Right)
				i.Run(n.Commands)
			} else {
				fmt.Printf("Condition '%s %s %s' is false; skipping command.\n", n.Left, n.Operator, n.Right)
			}
		
		

		}
	}
}
