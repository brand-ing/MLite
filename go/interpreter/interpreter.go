package interpreter

import (
	"fmt"
	"mlite/parser"
	"strconv"
)

type Interpreter struct {
	variables map[string]interface{}
}

// Create a new Interpreter
func NewInterpreter() *Interpreter {
	return &Interpreter{variables: make(map[string]interface{})}
}

// Convert a value to float64
func toFloat(value interface{}) float64 {
	switch v := value.(type) {
	case int:
		return float64(v)
	case float64:
		return v
	case string:
		f, err := strconv.ParseFloat(v, 64)
		if err != nil {
			panic(fmt.Sprintf("Cannot convert '%s' to a float", v))
		}
		return f
	default:
		panic(fmt.Sprintf("Cannot convert type %T to float", v))
	}
}

// Evaluate an expression
func evaluateExpression(expr *parser.ExpressionNode, variables map[string]interface{}) interface{} {
	switch expr.Type {
	case parser.LITERAL: // Handle literal values
		return expr.Value
	case parser.IDENTIFIER: // Resolve variable references
		if val, ok := variables[expr.Value.(string)]; ok {
			return val
		}
		panic(fmt.Sprintf("Undefined variable: %s", expr.Value))
	default:
		panic(fmt.Sprintf("Unsupported expression type: %v", expr.Type))
	}
}

func contains(slice []int, value int) bool {
    for _, v := range slice {
        if v == value {
            return true
        }
    }
    return false
}


func (i *Interpreter) StepRun(node parser.Node) {
    i.Run([]parser.Node{node})
}


// Run executes the parsed nodes
func (i *Interpreter) Run(nodes []parser.Node) {
	for _, node := range nodes {
		if contains(breakpoints, index) {
            fmt.Printf("Paused at line %d due to breakpoint\n", index)
            break
        }
		switch n := node.(type) {
		case *parser.LetNode: // Handle "let" statements
			value := evaluateExpression(n.Value, i.variables)
			i.variables[n.Variable] = value
			fmt.Printf("Declared variable %s = %v\n", n.Variable, value)

		case *parser.SetNode:
			value := evaluateExpression(n.Value, i.variables)
			i.variables[n.Variable] = value
			fmt.Printf("Set variable %s = %v\n", n.Variable, value)

		case *parser.LoadNode:
			fmt.Printf("Loading file: %s\n", n.File)

		case *parser.SaveNode:
			fmt.Printf("Saving to file: %s\n", n.File)

		case *parser.TrainNode:
			pythonCode := fmt.Sprintf(
				"from sklearn.linear_model import LinearRegression\n"+
					"%s = LinearRegression()\n"+
					"%s.fit(%s, %s)\n",
				n.Model, n.Model, n.Features, n.Target,
			)
			executePython(pythonCode)
			fmt.Printf("Trained model '%s' successfully\n", n.Model)
		
		case *parser.PredictNode:
			pythonCode := fmt.Sprintf(
				"prediction = %s.predict([%v])\nprint(prediction)",
				n.Model, n.Input,
			)
			result := executePython(pythonCode)
			fmt.Printf("Prediction for input %v: %s\n", n.Input, result)
		

		case *parser.LoopNode:
			countValue := evaluateExpression(n.Count, i.variables)
			count, ok := countValue.(int)
			if !ok {
				panic(fmt.Sprintf("Invalid loop count: %v", countValue))
			}

			for j := 0; j < count; j++ {
				fmt.Printf("Iteration %d of %d\n", j+1, count)
				i.Run(n.Commands)
			}

		case *parser.IfNode:
			leftValue := evaluateExpression(n.Left, i.variables)
			rightValue := evaluateExpression(n.Right, i.variables)

			condition := false
			switch n.Operator {
			case "==":
				condition = leftValue == rightValue
			case ">":
				condition = toFloat(leftValue) > toFloat(rightValue)
			case "<":
				condition = toFloat(leftValue) < toFloat(rightValue)
			case ">=":
				condition = toFloat(leftValue) >= toFloat(rightValue)
			case "<=":
				condition = toFloat(leftValue) <= toFloat(rightValue)
			default:
				panic(fmt.Sprintf("Unsupported operator: %s", n.Operator))
			}

			if condition {
				fmt.Printf("Condition '%v %s %v' is true; executing commands.\n", leftValue, n.Operator, rightValue)
				i.Run(n.Commands)
			} else {
				fmt.Printf("Condition '%v %s %v' is false; skipping commands.\n", leftValue, n.Operator, rightValue)
			}
		default:
			panic(fmt.Sprintf("Unsupported node type: %T", n))
		}
	}
}
