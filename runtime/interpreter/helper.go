package interpreter

import (
	"fmt"
	"os/exec"
)
//needs to be tested
func checkPythonPackages() {
	cmd := exec.Command("python3", "-c", "import pandas, sklearn, matplotlib, seaborn")
	err := cmd.Run()
	if err != nil {
		fmt.Println("Required Python packages are missing.")
		fmt.Println("Please run: pip install -r python/requirements.txt")
		panic("Missing dependencies!")
	}
}
// TODO: Explore replacing this with native Go functionality for performance and deployment benefits.
func executePython(script string, args ...string) {
	cmd := exec.Command("python3", append([]string{script}, args...)...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		panic(fmt.Sprintf("Error running Python script '%s': %s\nOutput: %s", script, err, out))
	}
	fmt.Printf("Python Output:\n%s\n", out)
}


