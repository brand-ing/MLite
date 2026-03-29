import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import App from "./App";

// Each test gets a clean fetch mock so they don't interfere with each other.
beforeEach(() => {
  jest.resetAllMocks();
});

// ─── Test 1: fetch is actually called ────────────────────────────────────────
// If this fails: the useEffect health poll is never running — wiring issue.
test("health check: fetch is called on mount", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

  await act(async () => { render(<App />); });

  expect(global.fetch).toHaveBeenCalledWith("http://localhost:8080/health");
});

// ─── Test 2: dot turns green when server is online ───────────────────────────
// If this fails: fetch is called but setServerOnline(true) is not being
// reflected in the rendered dot — a state/render wiring issue.
test("health check: dot is green when server responds ok", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

  await act(async () => { render(<App />); });

  const dot = screen.getByTitle("Server online");
  expect(dot).toBeInTheDocument();
  expect(dot).toHaveStyle({ background: "#00ff9f" });
});

// ─── Test 3: dot stays red when server is offline ────────────────────────────
// If this fails: error handling in the catch block is broken.
test("health check: dot is red when server is unreachable", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("connection refused"));

  await act(async () => { render(<App />); });

  const dot = screen.getByTitle(/Server offline/);
  expect(dot).toBeInTheDocument();
  expect(dot).toHaveStyle({ background: "#ff4444" });
});

// ─── Test 4: dot updates when server comes back online ───────────────────────
// Simulates server going offline then coming back — verifies the 3s poll works.
test("health check: dot updates from red to green when server recovers", async () => {
  jest.useFakeTimers();

  // First call fails (server down), second call succeeds (server back up)
  global.fetch = jest.fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ ok: true, json: async () => ({}) });

  await act(async () => { render(<App />); });

  // Should be red after first failed check
  expect(screen.getByTitle(/Server offline/)).toBeInTheDocument();

  // Advance 3 seconds to trigger the next poll
  await act(async () => { jest.advanceTimersByTime(3000); });

  // Should now be green
  expect(screen.getByTitle("Server online")).toBeInTheDocument();

  jest.useRealTimers();
});