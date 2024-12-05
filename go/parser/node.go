package parser


type Node interface{}

type LoadNode struct {
	File string
}

type SaveNode struct {
	File string
}

type TrainNode struct {
    Model    string
    Features []string
    Target   string
}

type PredictNode struct {
    Model string
    Input []float64
}



type LetNode struct {
	Variable string
	Value    *ExpressionNode
}

type SetNode struct {
	Variable string
	Value    *ExpressionNode
}

type IfNode struct {
	Left     *ExpressionNode
	Operator string
	Right    *ExpressionNode
	Commands []Node
}

type LoopNode struct {
	Count    *ExpressionNode
	Commands []Node
}





 

func (l *LetNode) TokenLiteral() string {
    return l.Variable
}

// ExpressionNode represents an expression in the AST

type ExpressionNode struct {
    Type  string      // Type of the expression (e.g., "LITERAL", "IDENTIFIER")
    Value interface{} // Value or variable name
}



type VarDeclaration struct {
    Name  string          // Variable name
    Value *ExpressionNode // The expression or value assigned to the variable
}
