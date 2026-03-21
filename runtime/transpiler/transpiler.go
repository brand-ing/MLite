package transpiler

import "strings"

type Transpiler struct {
	output strings.Builder
	indent int // tracks nesting level for indentation
}