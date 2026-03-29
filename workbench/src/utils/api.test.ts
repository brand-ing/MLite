// Tests for the server connection layer.
// Run with: npm test -- --watchAll=false

export {};

const SERVER_URL = "http://localhost:8081";

// Checks that the server is reachable and returns status "ok".
// If this fails: the Go server is not running — start it with start-server.bat
test("GET /health returns status ok", async () => {
  const res = await fetch(`${SERVER_URL}/health`);
  expect(res.ok).toBe(true);

  const body = await res.json();
  expect(body.status).toBe("ok");
});

// Checks that /health responds with HTTP 200 (not 404/500).
// A non-200 means the route is missing from the server's mux entirely.
// Note: CORS header visibility is browser-only — Jest's fetch strips them.
test("GET /health returns HTTP 200", async () => {
  const res = await fetch(`${SERVER_URL}/health`);
  expect(res.status).toBe(200);
});

// Checks the full transpile pipeline responds to a minimal MLite script.
test("POST /transpile returns python for a load statement", async () => {
  const res = await fetch(`${SERVER_URL}/transpile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: 'load("housing.csv")' }),
  });
  expect(res.ok).toBe(true);

  const body = await res.json();
  expect(body.python).toContain('pd.read_csv("housing.csv")');
  expect(body.error).toBeUndefined();
});

// Checks that a syntax error in MLite returns an error field, not a crash.
test("POST /transpile returns error field on bad syntax", async () => {
  const res = await fetch(`${SERVER_URL}/transpile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "this is not valid mlite" }),
  });
  const body = await res.json();
  expect(body.error).toBeDefined();
  expect(body.python).toBeUndefined();
});