import express from "express";
import { readFileSync } from "fs";

const app = express();
app.use(express.json());

const ALLOW_ORIGIN = "*";
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Load manifest (ensure file exists)
let manifest;
try {
  manifest = JSON.parse(readFileSync("./manifest.json", "utf-8"));
} catch {
  manifest = null;
}

// Data
const DATA = [
  { id: "bp-001", title: "Blood Pressure Basics", content: "Normal adult resting blood pressure ~120/80 mmHg." },
  { id: "hr-002", title: "Resting Heart Rate", content: "Average resting HR: 60–80 bpm; athletes often lower." }
];

const brief = (r) => {
  const description = r.content.length > 80 ? r.content.slice(0,77) + "..." : r.content;
  return { id: r.id, title: r.title, description, snippet: description };
};

// Health/root
app.get("/", (_req,res) => res.json({ status: "ok" }));

// Serve manifest (if present)
if (manifest) {
  app.get("/manifest.json", (_req,res) => res.json(manifest));
}

// Optional GET /search (info only)
app.get("/search", (_req,res) =>
  res.json({ info: "Use POST /search with JSON body { query: <string> }" })
);

// POST /search
app.post("/search", (req,res) => {
  const { query } = req.body || {};
  const q = (query || "").toLowerCase().trim();
  const results = DATA.filter(r =>
    !q ||
    r.title.toLowerCase().includes(q) ||
    r.content.toLowerCase().includes(q)
  ).map(brief);
  res.json({ results });
});

// POST /fetch
app.post("/fetch", (req,res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "Missing 'id'" });
  const rec = DATA.find(r => r.id === id);
  if (!rec) return res.status(404).json({ error: "Not found" });
  res.json({ id: rec.id, title: rec.title, content: rec.content });
});

// 404
app.use((_req,res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("MCP minimal server on", PORT));