package parser

type Node interface{}

type LoadNode struct {
	File string
}

type SaveNode struct {
	File string
}

type TrainNode struct {
	Model  string
	Data   string
	Target string
}

type SetNode struct {
    Variable string
    Value    string
}

type LoopNode struct {
    Count   string // Variable or literal number
    Commands []Node   // Command to be executed
}

type IfNode struct {
    Left     string // Left-hand side of the comparison
    Operator string // Comparison operator (e.g., "==")
    Right    string // Right-hand side of the comparison
    Commands  []Node   // Command to execute if the condition is true
}

