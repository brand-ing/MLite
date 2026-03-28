package transpiler

import (
	"fmt"
	"mlite/parser"
	"strings"
)

// Transpiler walks the AST and builds a Python source string.
// It never executes anything — it only writes text.
type Transpiler struct {
	output strings.Builder // accumulates every line of Python we generate
	indent int             // how many levels deep are we right now?
}

func NewTranspiler() *Transpiler {
	return &Transpiler{}
}

// writeLine writes one line at the correct indentation level.
// strings.Repeat("    ", t.indent) produces the right number of spaces.
// When indent=0: no spaces. indent=1: 4 spaces. indent=2: 8 spaces.
func (t *Transpiler) writeLine(line string) {
	t.output.WriteString(strings.Repeat("    ", t.indent) + line + "\n")
}

// Transpile is the main entry point — receives the same []Node the
// interpreter used to receive, but returns Python source code instead
// of executing anything.
func (t *Transpiler) Transpile(nodes []parser.Node) string {
	// Every generated file needs these imports at the top.
	t.output.WriteString("import pandas as pd\n")
	t.output.WriteString("from sklearn.linear_model import LinearRegression\n")
	t.output.WriteString("\n")

	for _, node := range nodes {
		t.transpileNode(node)
	}

	return t.output.String()
}

// transpileNode switches on node type — same structure as interpreter.go's Run(),
// but each case writes a string instead of doing something.
func (t *Transpiler) transpileNode(node parser.Node) {
	switch n := node.(type) {

	// MLite:  let x :: 10
	// Python: x = 10
	case *parser.LetNode:
		t.writeLine(fmt.Sprintf("%s = %v", n.Variable, n.Value.Value))

	// MLite:  set(x, 10)
	// Python: x = 10
	case *parser.SetNode:
		t.writeLine(fmt.Sprintf("%s = %v", n.Variable, n.Value.Value))

	// MLite:  load("data.csv")
	// Python: df = pd.read_csv("data.csv")
	// "df" is the standard pandas dataframe variable name by convention.
	case *parser.LoadNode:
		t.writeLine(fmt.Sprintf(`df = pd.read_csv("%s")`, n.File))

	// MLite:  save("output.csv")
	// Python: df.to_csv("output.csv", index=False)
	case *parser.SaveNode:
		t.writeLine(fmt.Sprintf(`df.to_csv("%s", index=False)`, n.File))

	// MLite:  train(myModel, feature, target)
	// Python: myModel = LinearRegression()
	//         myModel.fit(df[["feature"]], df["target"])
	//
	// df[[...]] uses double brackets because sklearn needs a 2D array
	// for features, not a 1D series. This is a sklearn convention.
	case *parser.TrainNode:
		t.writeLine(fmt.Sprintf("%s = LinearRegression()", n.Model))
		features := `df[["` + strings.Join(n.Features, `", "`) + `"]]`
		t.writeLine(fmt.Sprintf(`%s.fit(%s, df["%s"])`, n.Model, features, n.Target))

	// MLite:  predict(myModel, [1.5, 2.0])
	// Python: print(myModel.predict([[1.5, 2.0]]))
	//
	// The [[]] wrapping is because sklearn.predict expects a 2D array
	// even for a single sample.
	case *parser.PredictNode:
		var nums []string
		for _, v := range n.Input {
			nums = append(nums, fmt.Sprintf("%v", v))
		}
		t.writeLine(fmt.Sprintf("print(%s.predict([[%s]]))", n.Model, strings.Join(nums, ", ")))

	// MLite:  if(x > 5) { ... }
	// Python: if x > 5:
	//             ...       ← indented
	//
	// indent++ before the block, indent-- after.
	// Every writeLine call inside the block sees the higher indent value
	// and prepends more spaces automatically.
	case *parser.IfNode:
		t.writeLine(fmt.Sprintf("if %v %s %v:", n.Left.Value, n.Operator, n.Right.Value))
		t.indent++
		for _, cmd := range n.Commands {
			t.transpileNode(cmd)
		}
		t.indent--

	// MLite:  loop(3) { ... }
	// Python: for i in range(3):
	//             ...       ← indented
	case *parser.LoopNode:
		t.writeLine(fmt.Sprintf("for i in range(%v):", n.Count.Value))
		t.indent++
		for _, cmd := range n.Commands {
			t.transpileNode(cmd)
		}
		t.indent--

	default:
		panic(fmt.Sprintf("transpiler: unsupported node type %T", node))
	}
}