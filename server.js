/**
 * Consumer Health MCP Server
 * -------------------------------------
 * Adds single-account BodySpec integration (Bearer token auth).
 * 
 * SECURITY:
 *   - Do NOT hardcode your BodySpec token in this file.
 *   - Set it in an environment variable: BODYSPEC_TOKEN
 * 
 * BODY SPEC DOCS (summary):
 *   - Uses OIDC / OAuth2; also supports server-to-server Bearer JWT token (recommended for automation). 
 *   - /api/v1/users/me/results/ returns paginated BodySpec results for the authenticated account.
 *   - Use additional endpoints to pull DEXA composition, scan-info, etc. by result_id.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ---------------------------
// Helpers (local mock data)
// ---------------------------
function readData(file) {
  const dataPath = path.join(__dirname, 'data', file);
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// ---------------------------
// Root
// ---------------------------
app.get('/', (req, res) => {
  res.send({ status: "MCP Health Server is running" });
});

// ---------------------------
// Local mock endpoints
// ---------------------------
app.get('/labs', (req, res) => {
  const labs = readData('labs.json');
  res.send({ labs });
});

app.get('/medications', (req, res) => {
  const meds = readData('medications.json');
  res.send({ medications: meds });
});

app.get('/doctor-prep', (req, res) => {
  const visits = readData('visits.json');
  const latestVisit = visits[0];
  res.send({
    summary: `Your last visit was with Dr. ${latestVisit.doctor} on ${latestVisit.date}. Notes: ${latestVisit.notes}`
  });
});

// ============================================================
// BodySpec Integration (single BodySpec account; Bearer token)
// ============================================================
const BODYSPEC_BASE = "https://app.bodyspec.com";
const BODYSPEC_TOKEN = process.env.BODYSPEC_TOKEN; // *** Set in Render ***
if (!BODYSPEC_TOKEN) {
  console.warn("WARNING: BODYSPEC_TOKEN not set. BodySpec endpoints will fail.");
}

/**
 * GET /bodyspec/results
 * Fetch paginated BodySpec results list for the authenticated account.
 * Query params: offset, limit (pass-through)
 * Docs: /api/v1/users/me/results/  (BodySpec 'Results' tag)
 */
app.get('/bodyspec/results', async (req, res) => {
  if (!BODYSPEC_TOKEN) {
    return res.status(500).send({ error: "BODYSPEC_TOKEN not configured" });
  }
  try {
    const { offset, limit } = req.query;
    const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/`, {
      params: { offset, limit },
      headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
    });
    res.json(resp.data);
  } catch (err) {
    console.error("BodySpec /results error:", err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).send({ error: "Failed to fetch BodySpec results", detail: err?.response?.data });
  }
});

/**
 * GET /bodyspec/results/:result_id/composition
 * Fetch DEXA body composition data for a specific result.
 * Docs: /api/v1/users/me/results/{result_id}/dexa/composition
 */
app.get('/bodyspec/results/:result_id/composition', async (req, res) => {
  if (!BODYSPEC_TOKEN) {
    return res.status(500).send({ error: "BODYSPEC_TOKEN not configured" });
  }
  const { result_id } = req.params;
  try {
    const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/${result_id}/dexa/composition`, {
      headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
    });
    res.json(resp.data);
  } catch (err) {
    console.error("BodySpec /composition error:", err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).send({ error: "Failed to fetch BodySpec DEXA composition", detail: err?.response?.data });
  }
});

/**
 * GET /bodyspec/results/:result_id/scan-info
 * Fetch scan metadata for a specific result.
 * Docs: /api/v1/users/me/results/{result_id}/dexa/scan-info
 */
app.get('/bodyspec/results/:result_id/scan-info', async (req, res) => {
  if (!BODYSPEC_TOKEN) {
    return res.status(500).send({ error: "BODYSPEC_TOKEN not configured" });
  }
  const { result_id } = req.params;
  try {
    const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/${result_id}/dexa/scan-info`, {
      headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
    });
    res.json(resp.data);
  } catch (err) {
    console.error("BodySpec /scan-info error:", err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).send({ error: "Failed to fetch BodySpec scan info", detail: err?.response?.data });
  }
});

// --------------------------------------
// Start server
// --------------------------------------
app.listen(PORT, () => {
  console.log(`MCP Health Server running on port ${PORT}`);
});
