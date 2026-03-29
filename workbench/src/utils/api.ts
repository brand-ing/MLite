const SERVER_URL = "http://localhost:8081";

export interface TranspileResult {
  python?: string;
  error?: string;
}

// Sends MLite source code to the Go server and returns the transpiled Python.
// On network failure (server not running) it returns a descriptive error.
export async function transpile(code: string): Promise<TranspileResult> {
  try {
    const res = await fetch(`${SERVER_URL}/transpile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return await res.json();
  } catch (err) {
    return { error: "Could not reach server. Is the Go server running?\nStart it with: go build -tags server -o mlite_server.exe && ./mlite_server.exe" };
  }
}