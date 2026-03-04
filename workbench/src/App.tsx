import { useState, useRef, useEffect } from "react";

const SAMPLE_MLITE = `# MLITE Workflow v0.1
# Iris classification example

LOAD data FROM "iris.csv" AS dataset

TRANSFORM dataset:
  DROP COLUMN "id"
  NORMALIZE COLUMNS ["sepal_length", "sepal_width", "petal_length", "petal_width"]
  ENCODE COLUMN "species" AS label

SPLIT dataset INTO train=0.8, test=0.2 SEED=42

TRAIN model:
  TYPE = "RandomForest"
  FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
  TARGET = "species"
  PARAMS = { n_estimators: 100, max_depth: 5 }
  USING train

EVALUATE model:
  ON test
  METRICS = ["accuracy", "f1_score", "confusion_matrix"]

EXPORT model AS "iris_model.pkl"
`;

const PYTHON_OUTPUT = `import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
import pickle

# --- LOAD ---
dataset = pd.read_csv("iris.csv")

# --- TRANSFORM ---
dataset = dataset.drop(columns=["id"])
scaler = StandardScaler()
dataset[["sepal_length","sepal_width",
         "petal_length","petal_width"]] = scaler.fit_transform(
    dataset[["sepal_length","sepal_width",
             "petal_length","petal_width"]])
le = LabelEncoder()
dataset["species"] = le.fit_transform(dataset["species"])

# --- SPLIT ---
X = dataset[["sepal_length","sepal_width",
             "petal_length","petal_width"]]
y = dataset["species"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

# --- TRAIN ---
model = RandomForestClassifier(
    n_estimators=100, max_depth=5)
model.fit(X_train, y_train)

# --- EVALUATE ---
y_pred = model.predict(X_test)
print("accuracy:", accuracy_score(y_test, y_pred))
print("f1_score:", f1_score(y_test, y_pred,
                             average="weighted"))
print("confusion_matrix:\\n",
      confusion_matrix(y_test, y_pred))

# --- EXPORT ---
with open("iris_model.pkl", "wb") as f:
    pickle.dump(model, f)
`;

const PIPELINE_STEPS = [
  {
    id: 0,
    keyword: "LOAD",
    label: "Load Data",
    icon: "⬇",
    status: "done",
    lines: [3],
    vars: {
      dataset: {
        type: "DataFrame",
        shape: "[150, 6]",
        preview:
          "sepal_length, sepal_width, petal_length, petal_width, species, id",
      },
    },
    log: [
      "Reading iris.csv...",
      "Loaded 150 rows × 6 columns",
      "Inferred dtypes: float64 (×5), object (×1)",
    ],
  },
  {
    id: 1,
    keyword: "TRANSFORM",
    label: "Transform",
    icon: "⚙",
    status: "done",
    lines: [5, 6, 7, 8],
    vars: {
      dataset: {
        type: "DataFrame",
        shape: "[150, 5]",
        preview:
          "sepal_length, sepal_width, petal_length, petal_width, species",
      },
      scaler: {
        type: "StandardScaler",
        shape: "fitted",
        preview: "mean=[5.84, 3.05, 3.76, 1.20]",
      },
      le: {
        type: "LabelEncoder",
        shape: "fitted",
        preview: "classes=['setosa','versicolor','virginica']",
      },
    },
    log: [
      "Dropped column: id",
      "Normalizing 4 numeric columns...",
      "  → mean=0.0, std=1.0 ✓",
      "Encoding 'species' → {0,1,2}",
      "Transform complete: 150 × 5",
    ],
  },
  {
    id: 2,
    keyword: "SPLIT",
    label: "Split",
    icon: "✂",
    status: "done",
    lines: [10],
    vars: {
      train: {
        type: "DataFrame",
        shape: "[120, 5]",
        preview: "80% of dataset",
      },
      test: { type: "DataFrame", shape: "[30, 5]", preview: "20% of dataset" },
    },
    log: [
      "Splitting with seed=42",
      "Train set: 120 samples (80%)",
      "Test set:  30 samples (20%)",
      "Class distribution balanced ✓",
    ],
  },
  {
    id: 3,
    keyword: "TRAIN",
    label: "Train Model",
    icon: "🧠",
    status: "active",
    lines: [12, 13, 14, 15, 16],
    vars: {
      model: {
        type: "RandomForestClassifier",
        shape: "100 estimators",
        preview: "max_depth=5, fitting...",
      },
    },
    log: [
      "Initializing RandomForestClassifier",
      "  n_estimators=100, max_depth=5",
      "Fitting on 120 samples...",
      "▋ Training in progress...",
    ],
  },
  {
    id: 4,
    keyword: "EVALUATE",
    label: "Evaluate",
    icon: "📊",
    status: "pending",
    lines: [18, 19, 20],
    vars: {},
    log: [],
  },
  {
    id: 5,
    keyword: "EXPORT",
    label: "Export",
    icon: "📦",
    status: "pending",
    lines: [22],
    vars: {},
    log: [],
  },
];

const STATUS_COLORS = {
  done: "#00ff9f",
  active: "#f0c040",
  pending: "#444",
  error: "#ff4444",
};

const STATUS_BG = {
  done: "rgba(0,255,159,0.08)",
  active: "rgba(240,192,64,0.12)",
  pending: "transparent",
  error: "rgba(255,68,68,0.12)",
};

export default function MLITEDebugger() {
  const [activeStep, setActiveStep] = useState(3);
  const [activeTab, setActiveTab] = useState("trace");
  const [mliteCode, setMliteCode] = useState(SAMPLE_MLITE);
  const [isRunning, setIsRunning] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((l) => (l + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeStep]);

  const handleRun = () => {
    setIsRunning(true);
    setGlitch(true);
    setTimeout(() => setGlitch(false), 300);
    setTimeout(() => setIsRunning(false), 2000);
  };

  const step = PIPELINE_STEPS[activeStep];
  const highlightedLines = step?.lines || [];

  const getLineHighlight = (lineIdx) => {
    if (highlightedLines.includes(lineIdx)) return "rgba(240,192,64,0.18)";
    return "transparent";
  };

  const mliteLines = mliteCode.split("\n");

  return (
    <div
      style={{
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        background: "#0a0a0f",
        color: "#c8d0e0",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1e2a1e",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "#080d08",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              color: "#00ff9f",
              fontSize: 18,
              fontWeight: "bold",
              letterSpacing: "0.15em",
              textShadow: "0 0 12px #00ff9f88",
              filter: glitch ? "blur(1px) hue-rotate(90deg)" : "none",
              transition: "filter 0.1s",
            }}
          >
            MLITE
          </span>
          <span style={{ color: "#334", fontSize: 12 }}>v0.1-debug</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["LOAD", "TRANSFORM", "SPLIT", "TRAIN", "EVALUATE", "EXPORT"].map(
            (kw, i) => (
              <div
                key={kw}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                <div
                  onClick={() => setActiveStep(i)}
                  style={{
                    padding: "3px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                    color:
                      i === activeStep
                        ? STATUS_COLORS[PIPELINE_STEPS[i].status]
                        : STATUS_COLORS[PIPELINE_STEPS[i].status] + "88",
                    background:
                      i === activeStep
                        ? STATUS_BG[PIPELINE_STEPS[i].status]
                        : "transparent",
                    border: `1px solid ${i === activeStep ? STATUS_COLORS[PIPELINE_STEPS[i].status] + "66" : "transparent"}`,
                    borderRadius: 3,
                    letterSpacing: "0.05em",
                    transition: "all 0.15s",
                    textShadow:
                      i === activeStep && PIPELINE_STEPS[i].status === "done"
                        ? "0 0 8px #00ff9f66"
                        : "none",
                  }}
                >
                  {kw}
                </div>
                {i < 5 && (
                  <span
                    style={{ color: "#222", margin: "0 2px", fontSize: 10 }}
                  >
                    →
                  </span>
                )}
              </div>
            ),
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            padding: "6px 18px",
            background: isRunning ? "transparent" : "rgba(0,255,159,0.1)",
            border: "1px solid #00ff9f66",
            color: "#00ff9f",
            cursor: isRunning ? "default" : "pointer",
            fontSize: 12,
            letterSpacing: "0.1em",
            borderRadius: 3,
            transition: "all 0.2s",
          }}
        >
          {isRunning ? "▋ RUNNING..." : "▶ RUN"}
        </button>
      </div>

      {/* Main 3-panel layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT: MLITE source */}
        <div
          style={{
            width: "28%",
            borderRight: "1px solid #1a221a",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              fontSize: 11,
              color: "#445",
              borderBottom: "1px solid #1a1a2a",
              background: "#060a06",
              letterSpacing: "0.1em",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              SOURCE <span style={{ color: "#334" }}>workflow.mlite</span>
            </span>
            <span style={{ color: "#2a4a2a", fontSize: 10 }}>
              {mliteLines.length} lines
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              fontSize: 12,
              lineHeight: "1.7",
            }}
          >
            {mliteLines.map((line, i) => {
              const isHighlighted = highlightedLines.includes(i);
              const isComment = line.trim().startsWith("#");
              const isKeyword =
                /^(LOAD|TRANSFORM|SPLIT|TRAIN|EVALUATE|EXPORT|DROP|NORMALIZE|ENCODE|USING|ON|TYPE|FEATURES|TARGET|PARAMS|METRICS|FROM|INTO|AS|SEED)/.test(
                  line.trim(),
                );

              let color = "#8896aa";
              if (isComment) color = "#3d5a3d";
              else if (isHighlighted) color = "#e8d88a";
              else if (isKeyword) color = "#7ac";

              const parts = line.split(
                /(\b(?:LOAD|TRANSFORM|SPLIT|TRAIN|EVALUATE|EXPORT|DROP|NORMALIZE|ENCODE|USING|ON|TYPE|FEATURES|TARGET|PARAMS|METRICS|FROM|INTO|AS|SEED)\b)/g,
              );

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    background: isHighlighted
                      ? "rgba(240,192,64,0.1)"
                      : "transparent",
                    borderLeft: isHighlighted
                      ? "2px solid #f0c040aa"
                      : "2px solid transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      textAlign: "right",
                      paddingRight: 12,
                      color: isHighlighted ? "#f0c04066" : "#252835",
                      userSelect: "none",
                      flexShrink: 0,
                      fontSize: 11,
                      paddingTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      paddingRight: 12,
                      whiteSpace: "pre",
                      color: isComment ? "#3d5a3d" : color,
                    }}
                  >
                    {isComment
                      ? line
                      : parts.map((part, pi) => {
                          const kws = [
                            "LOAD",
                            "TRANSFORM",
                            "SPLIT",
                            "TRAIN",
                            "EVALUATE",
                            "EXPORT",
                            "DROP",
                            "NORMALIZE",
                            "ENCODE",
                            "USING",
                            "ON",
                            "TYPE",
                            "FEATURES",
                            "TARGET",
                            "PARAMS",
                            "METRICS",
                            "FROM",
                            "INTO",
                            "AS",
                            "SEED",
                          ];
                          if (kws.includes(part)) {
                            return (
                              <span
                                key={pi}
                                style={{ color: "#00cc88", fontWeight: "bold" }}
                              >
                                {part}
                              </span>
                            );
                          }
                          if (/"[^"]*"/.test(part)) {
                            return (
                              <span key={pi} style={{ color: "#e8a87a" }}>
                                {part}
                              </span>
                            );
                          }
                          return <span key={pi}>{part}</span>;
                        })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Debug panels */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid #1a221a",
          }}
        >
          {/* Step header */}
          <div
            style={{
              padding: "10px 16px",
              background: "#060d06",
              borderBottom: "1px solid #1a221a",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 20,
                filter:
                  step.status === "active"
                    ? "drop-shadow(0 0 6px #f0c04088)"
                    : "none",
              }}
            >
              {step.icon}
            </span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: STATUS_COLORS[step.status],
                  letterSpacing: "0.08em",
                  textShadow:
                    step.status === "done" ? "0 0 8px #00ff9f44" : "none",
                }}
              >
                {step.keyword}
              </div>
              <div style={{ fontSize: 11, color: "#445", marginTop: 1 }}>
                {step.label}
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                padding: "2px 10px",
                border: `1px solid ${STATUS_COLORS[step.status]}44`,
                borderRadius: 10,
                fontSize: 11,
                color: STATUS_COLORS[step.status],
                background: STATUS_BG[step.status],
                letterSpacing: "0.08em",
              }}
            >
              {step.status.toUpperCase()}
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #1a221a",
              background: "#060a06",
              flexShrink: 0,
            }}
          >
            {["trace", "vars", "python"].map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 18px",
                  fontSize: 11,
                  cursor: "pointer",
                  color: activeTab === tab ? "#00ff9f" : "#445",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid #00ff9f"
                      : "2px solid transparent",
                  letterSpacing: "0.1em",
                  transition: "all 0.15s",
                  textShadow: activeTab === tab ? "0 0 8px #00ff9f44" : "none",
                }}
              >
                {tab === "trace"
                  ? "EXEC TRACE"
                  : tab === "vars"
                    ? "VARIABLES"
                    : "PYTHON OUT"}
              </div>
            ))}
          </div>

          {/* Tab content */}
          <div
            style={{ flex: 1, overflow: "auto", padding: 16 }}
            ref={activeTab === "trace" ? logRef : null}
          >
            {activeTab === "trace" && (
              <div>
                {PIPELINE_STEPS.filter((s) => s.status !== "pending").map(
                  (s) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveStep(s.id)}
                      style={{
                        marginBottom: 16,
                        cursor: "pointer",
                        opacity: s.id === activeStep ? 1 : 0.55,
                        transition: "opacity 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            color: STATUS_COLORS[s.status],
                            fontSize: 12,
                          }}
                        >
                          {s.status === "done"
                            ? "✔"
                            : s.status === "active"
                              ? "▶"
                              : "○"}
                        </span>
                        <span
                          style={{
                            color: STATUS_COLORS[s.status],
                            fontSize: 12,
                            letterSpacing: "0.08em",
                            textShadow:
                              s.status === "done"
                                ? "0 0 6px #00ff9f44"
                                : "none",
                          }}
                        >
                          {s.keyword}
                        </span>
                        <span style={{ color: "#2a3a2a", fontSize: 10 }}>
                          line{s.lines.length > 1 ? "s" : ""}{" "}
                          {s.lines.map((l) => l + 1).join(", ")}
                        </span>
                      </div>
                      <div
                        style={{
                          borderLeft: `2px solid ${STATUS_COLORS[s.status]}33`,
                          paddingLeft: 14,
                        }}
                      >
                        {s.log.map((entry, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 12,
                              color: entry.includes("✓")
                                ? "#00cc66"
                                : entry.includes("▋")
                                  ? "#f0c040"
                                  : entry.startsWith("  →")
                                    ? "#88aaff"
                                    : "#667",
                              marginBottom: 2,
                              fontFamily: "inherit",
                            }}
                          >
                            <span style={{ color: "#2a3a2a", marginRight: 8 }}>
                              {">"}
                            </span>
                            {entry}
                            {entry.includes("▋") && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 8,
                                  animation: "blink 0.8s step-end infinite",
                                }}
                              >
                                █
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
                <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
              </div>
            )}

            {activeTab === "vars" && (
              <div>
                {Object.keys(step.vars).length === 0 ? (
                  <div style={{ color: "#334", fontSize: 13 }}>
                    No variables in scope yet.
                  </div>
                ) : (
                  Object.entries(step.vars).map(([name, info]) => (
                    <div
                      key={name}
                      style={{
                        marginBottom: 14,
                        border: "1px solid #1a2a1a",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "#060f06",
                          padding: "7px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          borderBottom: "1px solid #1a2a1a",
                        }}
                      >
                        <span
                          style={{
                            color: "#88ddff",
                            fontSize: 13,
                            fontWeight: "bold",
                          }}
                        >
                          {name}
                        </span>
                        <span
                          style={{
                            padding: "1px 8px",
                            background: "rgba(0,200,120,0.1)",
                            border: "1px solid #00cc7744",
                            borderRadius: 3,
                            fontSize: 11,
                            color: "#00cc88",
                          }}
                        >
                          {info.type}
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            color: "#445",
                            fontSize: 11,
                          }}
                        >
                          {info.shape}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "8px 14px",
                          fontSize: 12,
                          color: "#667",
                          fontStyle: "italic",
                        }}
                      >
                        {info.preview}
                      </div>
                    </div>
                  ))
                )}
                {step.status === "pending" && (
                  <div
                    style={{
                      padding: 16,
                      border: "1px dashed #222",
                      borderRadius: 4,
                      color: "#334",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    Step not yet executed
                  </div>
                )}
              </div>
            )}

            {activeTab === "python" && (
              <div
                style={{
                  fontFamily: "inherit",
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                {PYTHON_OUTPUT.split("\n").map((line, i) => {
                  const isSectionComment = line.startsWith("# ---");
                  const isComment = line.startsWith("#");
                  const isImport =
                    line.startsWith("import") || line.startsWith("from");
                  const isString = /"[^"]+"/.test(line);

                  let color = "#8896aa";
                  if (isSectionComment) color = "#00cc8888";
                  else if (isComment) color = "#3a5a3a";
                  else if (isImport) color = "#7799dd";

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        background: isSectionComment
                          ? "rgba(0,200,100,0.04)"
                          : "transparent",
                        padding: "0 4px",
                        borderLeft: isSectionComment
                          ? "2px solid #00cc6644"
                          : "2px solid transparent",
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          textAlign: "right",
                          paddingRight: 12,
                          color: "#222",
                          userSelect: "none",
                          flexShrink: 0,
                          fontSize: 11,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color, whiteSpace: "pre" }}>{line}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Pipeline visual + minimap */}
        <div
          style={{
            width: "18%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#060a06",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              fontSize: 11,
              color: "#334",
              borderBottom: "1px solid #1a221a",
              letterSpacing: "0.1em",
            }}
          >
            PIPELINE
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 0",
              gap: 0,
              overflowY: "auto",
            }}
          >
            {PIPELINE_STEPS.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <div
                  onClick={() => setActiveStep(s.id)}
                  style={{
                    width: "80%",
                    padding: "10px 8px",
                    background:
                      s.id === activeStep ? STATUS_BG[s.status] : "transparent",
                    border: `1px solid ${s.id === activeStep ? STATUS_COLORS[s.status] + "88" : STATUS_COLORS[s.status] + "33"}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: STATUS_COLORS[s.status],
                      letterSpacing: "0.05em",
                      textShadow:
                        s.status === "done" && s.id === activeStep
                          ? "0 0 8px #00ff9f55"
                          : "none",
                    }}
                  >
                    {s.keyword}
                  </span>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: STATUS_COLORS[s.status],
                      boxShadow:
                        s.status === "active"
                          ? `0 0 8px ${STATUS_COLORS[s.status]}`
                          : "none",
                      marginTop: 2,
                    }}
                  />
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: `linear-gradient(to bottom, ${STATUS_COLORS[s.status]}66, ${STATUS_COLORS[PIPELINE_STEPS[i + 1].status]}44)`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Status legend */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #1a221a",
              fontSize: 10,
              color: "#334",
            }}
          >
            {Object.entries(STATUS_COLORS).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: v,
                  }}
                />
                <span style={{ color: v, letterSpacing: "0.05em" }}>
                  {k.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div
        style={{
          borderTop: "1px solid #1a221a",
          padding: "5px 16px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "#040704",
          fontSize: 11,
          color: "#334",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#00cc88" }}>●</span>
        <span>MLITE DEBUGGER</span>
        <span style={{ color: "#223" }}>|</span>
        <span>
          Step {activeStep + 1}/{PIPELINE_STEPS.length}
        </span>
        <span style={{ color: "#223" }}>|</span>
        <span style={{ color: "#445" }}>
          Active: <span style={{ color: "#f0c040" }}>{step.keyword}</span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#2a4a2a" }}>
          Python 3.11 · sklearn 1.4 · pandas 2.1
        </span>
        <span style={{ color: "#223" }}>|</span>
        <span
          style={{
            color: "#00ff9f",
            opacity: 0.4 + (scanLine % 10) * 0.06,
          }}
        >
          █
        </span>
      </div>
    </div>
  );
}
