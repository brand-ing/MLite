package transpiler

import (
	"mlite/parser"
	"strings"
	"testing"
)

// helper: runs the transpiler on a slice of nodes and returns the output
// minus the standard import header, so each test only checks the relevant lines.
func transpileNodes(nodes []parser.Node) string {
	t := NewTranspiler()
	result := t.Transpile(nodes)
	// Strip the 3-line header (2 imports + blank line) so tests stay focused
	lines := strings.SplitN(result, "\n", 4)
	if len(lines) < 4 {
		return result
	}
	return lines[3]
}

// Checks that load() maps to pandas read_csv with the correct filename.
// Python convention: the dataframe is always named "df".
func TestTranspileLoad(t *testing.T) {
	nodes := []parser.Node{
		&parser.LoadNode{File: "housing.csv"},
	}
	got := transpileNodes(nodes)
	want := `df = pd.read_csv("housing.csv")` + "\n"
	if got != want {
		t.Errorf("load: got %q, want %q", got, want)
	}
}

// Checks that let produces a plain Python assignment with no type declaration.
// Python has no "int x = 5" — just "x = 5".
func TestTranspileLet(t *testing.T) {
	nodes := []parser.Node{
		&parser.LetNode{
			Variable: "epochs",
			Value:    &parser.ExpressionNode{Type: "LITERAL", Value: "5"},
		},
	}
	got := transpileNodes(nodes)
	want := "epochs = 5\n"
	if got != want {
		t.Errorf("let: got %q, want %q", got, want)
	}
}

// Checks that train() emits two lines: model instantiation then model.fit().
// Features use double brackets df[[...]] because sklearn needs a 2D array.
func TestTranspileTrain(t *testing.T) {
	nodes := []parser.Node{
		&parser.TrainNode{
			Model:    "model",
			Features: []string{"sqft"},
			Target:   "price",
		},
	}
	got := transpileNodes(nodes)
	wantLines := []string{
		"model = LinearRegression()",
		`model.fit(df[["sqft"]], df["price"])`,
	}
	for _, line := range wantLines {
		if !strings.Contains(got, line) {
			t.Errorf("train: output missing line %q\ngot:\n%s", line, got)
		}
	}
}

// Checks that predict() wraps the input in [[]] for sklearn's 2D requirement
// and prints the result.
func TestTranspilePredict(t *testing.T) {
	nodes := []parser.Node{
		&parser.PredictNode{
			Model: "model",
			Input: []float64{1.5, 2.0},
		},
	}
	got := transpileNodes(nodes)
	want := "print(model.predict([[1.5, 2]]))\n"
	if got != want {
		t.Errorf("predict: got %q, want %q", got, want)
	}
}

// Checks that if block body is indented exactly 4 spaces.
// Python uses whitespace for structure — wrong indentation = broken code.
func TestTranspileIfIndentation(t *testing.T) {
	nodes := []parser.Node{
		&parser.IfNode{
			Left:     &parser.ExpressionNode{Type: "LITERAL", Value: "x"},
			Operator: ">",
			Right:    &parser.ExpressionNode{Type: "LITERAL", Value: "5"},
			Commands: []parser.Node{
				&parser.LoadNode{File: "data.csv"},
			},
		},
	}
	got := transpileNodes(nodes)
	wantLines := []string{
		"if x > 5:",
		`    df = pd.read_csv("data.csv")`, // 4 spaces indent inside if
	}
	for _, line := range wantLines {
		if !strings.Contains(got, line) {
			t.Errorf("if indent: output missing %q\ngot:\n%s", line, got)
		}
	}
}

// Checks that loop maps to Python's for/range and that the body is indented.
// MLite's loop(3) has no index variable — Python's range() is the equivalent.
func TestTranspileLoopIndentation(t *testing.T) {
	nodes := []parser.Node{
		&parser.LoopNode{
			Count: &parser.ExpressionNode{Type: "LITERAL", Value: "3"},
			Commands: []parser.Node{
				&parser.TrainNode{
					Model:    "model",
					Features: []string{"sqft"},
					Target:   "price",
				},
			},
		},
	}
	got := transpileNodes(nodes)
	wantLines := []string{
		"for i in range(3):",
		"    model = LinearRegression()", // 4 spaces — inside loop
	}
	for _, line := range wantLines {
		if !strings.Contains(got, line) {
			t.Errorf("loop indent: output missing %q\ngot:\n%s", line, got)
		}
	}
}

// Checks the full import header is present in every transpiled program.
// These imports are required for pandas and sklearn to work.
func TestTranspileImportHeader(t *testing.T) {
	tr := NewTranspiler()
	result := tr.Transpile([]parser.Node{&parser.LoadNode{File: "x.csv"}})
	if !strings.Contains(result, "import pandas as pd") {
		t.Error("missing pandas import")
	}
	if !strings.Contains(result, "from sklearn.linear_model import LinearRegression") {
		t.Error("missing sklearn import")
	}
}