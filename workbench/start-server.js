// Launches mlite_server.exe from the correct absolute path.
// Called by npm start via concurrently so special characters in the
// folder path (like parentheses) don't break Windows shell parsing.
const { spawn } = require("child_process");
const path = require("path");

const serverPath = path.resolve(__dirname, "..", "runtime", "mlite_server.exe");

const server = spawn(serverPath, [], { stdio: "inherit" });

server.on("error", (err) => {
  console.error("Failed to start MLite server:", err.message);
  console.error("Try rebuilding: cd runtime && go build -tags server -o mlite_server.exe .");
  process.exit(1);
});