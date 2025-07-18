import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// ---------- Middleware ----------
app.use(express.json({ limit: "256kb" }));
app.use(cors());
app.use(morgan("tiny"));

// ---------- Mock Data ----------
const DATA = [
  {
    id: "bp-001",
    title: "Blood Pressure Basics",
    content: "Normal adult resting blood pressure ~120/80 mmHg.",
    tags: ["vitals", "cardio"]
  },
  {
    id: "hr-002",
    title: "Resting Heart Rate",
    content: "Average resting HR: 60–80 bpm; athletes often lower.",
    tags: ["vitals", "cardio"]
  },
  {
    id: "gl-003",
    title: "Glucose Fasting Range",
    content: "Normal fasting blood glucose: 70–99 mg/dL.",
    tags: ["labs", "metabolic"]
  }
];

function searchRecords(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return DATA.map(briefResult);
  return DATA
    .filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      (r.tags || []).some(t => t.toLowerCase().includes(q))
    )
    .map(briefResult);
}

function getRecord(id) {
  return DATA.find(r => r.id === id);
}

function briefResult(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.content.length > 80 ? r.content.slice(0, 77) + "..." : r.content
  };
}

// ---------- Routes ----------

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "health-mcp", uptime_s: process.uptime() });
});

// POST /search
app.post("/search", (req, res) => {
  try {
    const { query } = req.body || {};
    const results = searchRecords(query);
    return res.json({ results });
  } catch (err) {
    console.error("Search error", err);
    return res.status(500).json({ error: "Internal search error" });
  }
});

// POST /fetch
app.post("/fetch", (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing 'id' in request body" });
    const rec = getRecord(id);
    if (!rec) return res.status(404).json({ error: "Not found", id });
    return res.json({
      id: rec.id,
      title: rec.title,
      content: rec.content,
      tags: rec.tags || []
    });
  } catch (err) {
    console.error("Fetch error", err);
    return res.status(500).json({ error: "Internal fetch error" });
  }
});

// POST /nbodyspec
app.post("/nbodyspec", (req, res) => {
  try {
    const { height, weight, age, gender } = req.body || {};
    if (!height || !weight) {
      return res.status(400).json({ error: "Missing height or weight" });
    }

    const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";

    return res.json({
      height,
      weight,
      age: age || null,
      gender: gender || "unspecified",
      bmi,
      category,
      message: "Body spec calculated successfully"
    });
  } catch (err) {
    console.error("nbodyspec error", err);
    res.status(500).json({ error: "Internal nbodyspec error" });
  }
});

// Fallback
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MCP server listening on port ${PORT}`));
