import express from "express";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";

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

    // Example BMI calculation
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

// ---------- BodySpec API Proxy Endpoints ----------

// POST /bodyspec/user - Get user info by email
app.post("/bodyspec/user", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    const apiKey = process.env.BODYSPEC_API_KEY;
    const response = await axios.get(
      `https://api.bodyspec.com/v1/users?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("BodySpec user fetch error", err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch user info from BodySpec", details: err?.response?.data || err.message });
  }
});

// POST /bodyspec/user/scans - Get all scans for a user by user_id
app.post("/bodyspec/user/scans", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });
    const apiKey = process.env.BODYSPEC_API_KEY;
    const response = await axios.get(
      `https://api.bodyspec.com/v1/users/${encodeURIComponent(user_id)}/scans`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("BodySpec user scans fetch error", err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch scans from BodySpec", details: err?.response?.data || err.message });
  }
});

// POST /bodyspec/scan - Get scan details by scan_id
app.post("/bodyspec/scan", async (req, res) => {
  try {
    const { scan_id } = req.body;
    if (!scan_id) return res.status(400).json({ error: "Missing scan_id" });
    const apiKey = process.env.BODYSPEC_API_KEY;
    const response = await axios.get(
      `https://api.bodyspec.com/v1/scans/${encodeURIComponent(scan_id)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("BodySpec scan fetch error", err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch scan from BodySpec", details: err?.response?.data || err.message });
  }
});

// POST /bodyspec/user/appointments - Get appointments for a user by user_id
app.post("/bodyspec/user/appointments", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });
    const apiKey = process.env.BODYSPEC_API_KEY;
    const response = await axios.get(
      `https://api.bodyspec.com/v1/users/${encodeURIComponent(user_id)}/appointments`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("BodySpec appointments fetch error", err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch appointments from BodySpec", details: err?.response?.data || err.message });
  }
});

// GET /bodyspec/locations - Get all BodySpec locations
app.get("/bodyspec/locations", async (_req, res) => {
  try {
    const apiKey = process.env.BODYSPEC_API_KEY;
    const response = await axios.get(
      `https://api.bodyspec.com/v1/locations`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("BodySpec locations fetch error", err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch locations from BodySpec", details: err?.response?.data || err.message });
  }
});

// Fallback
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MCP server listening on port ${PORT}`));