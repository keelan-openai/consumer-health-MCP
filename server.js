const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BODYSPEC_BASE = "https://app.bodyspec.com";
const BODYSPEC_TOKEN = process.env.BODYSPEC_TOKEN;

app.use(cors());
app.use(bodyParser.json());

// Helper function to read mock data
function readData(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf-8'));
}

// Root route
app.get('/', (req, res) => {
  res.send({ status: "MCP Health Server is running" });
});

// Serve mcp-config.json
app.get('/mcp-config.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'mcp-config.json'));
});

// Local mock endpoints
app.get('/labs', (req, res) => res.send({ labs: readData('labs.json') }));
app.get('/medications', (req, res) => res.send({ medications: readData('medications.json') }));
app.get('/doctor-prep', (req, res) => {
  const visits = readData('visits.json');
  const latestVisit = visits[0];
  res.send({
    summary: `Your last visit was with Dr. ${latestVisit.doctor} on ${latestVisit.date}. Notes: ${latestVisit.notes}`
  });
});

// BodySpec endpoints
app.get('/bodyspec/results', async (req, res) => {
  if (!BODYSPEC_TOKEN) return res.status(500).send({ error: "BODYSPEC_TOKEN not configured" });
  try {
    const { offset, limit } = req.query;
    const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/`, {
      params: { offset, limit },
      headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch BodySpec results', detail: err.message });
  }
});

app.get('/bodyspec/results/:result_id/composition', async (req, res) => {
  if (!BODYSPEC_TOKEN) return res.status(500).send({ error: "BODYSPEC_TOKEN not configured" });
  try {
    const { result_id } = req.params;
    const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/${result_id}/dexa/composition`, {
      headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch BodySpec composition', detail: err.message });
  }
});

app.get('/bodyspec/results/:result_id/scan-info', async (req, res) => {
  if (!BODYSPEC_TOKEN) return res.status(500).send({ error: "BODYSPEC_TOKEN not configured" });
  try {
    const { result_id } = req.params;
    const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/${result_id}/dexa/scan-info`, {
      headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch BodySpec scan info', detail: err.message });
  }
});

// MCP validator endpoints
app.get('/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = [];
  try {
    const labs = readData('labs.json');
    labs.filter(l => !q || JSON.stringify(l).toLowerCase().includes(q))
        .forEach(l => results.push({ id: `lab:${l.test}:${l.date}`, type: 'lab', ...l }));

    const meds = readData('medications.json');
    meds.filter(m => !q || JSON.stringify(m).toLowerCase().includes(q))
        .forEach(m => results.push({ id: `med:${m.name}`, type: 'medication', ...m }));

    const visits = readData('visits.json');
    visits.filter(v => !q || JSON.stringify(v).toLowerCase().includes(q))
          .forEach(v => results.push({ id: `visit:${v.date}`, type: 'visit', ...v }));

    if (BODYSPEC_TOKEN) {
      try {
        const resp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/`, {
          headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` },
          params: { limit: 20 }
        });
        (resp.data.results || []).forEach(r => results.push({
          id: `bodyspec:${r.result_id}`,
          type: 'bodyspec_result',
          ...r
        }));
      } catch (e) {}
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Search failure', detail: err.message });
  }
});

app.get('/fetch/:id', async (req, res) => {
  const rawId = req.params.id;
  const [prefix, ...rest] = rawId.split(':');
  try {
    if (prefix === 'lab') {
      const labs = readData('labs.json');
      const match = labs.find(l => `lab:${l.test}:${l.date}` === rawId);
      return res.json({ id: rawId, data: match });
    }
    if (prefix === 'med') {
      const meds = readData('medications.json');
      const name = rest.join(':');
      const match = meds.find(m => m.name === name);
      return res.json({ id: rawId, data: match });
    }
    if (prefix === 'visit') {
      const visits = readData('visits.json');
      const date = rest.join(':');
      const match = visits.find(v => v.date === date);
      return res.json({ id: rawId, data: match });
    }
    if (prefix === 'bodyspec') {
      if (!BODYSPEC_TOKEN) return res.status(500).json({ error: 'BODYSPEC_TOKEN not configured' });
      const resultId = rest.join(':');
      const detailResp = await axios.get(`${BODYSPEC_BASE}/api/v1/users/me/results/${resultId}`, {
        headers: { Authorization: `Bearer ${BODYSPEC_TOKEN}` }
      });
      return res.json({ id: rawId, detail: detailResp.data });
    }
    res.status(400).json({ error: 'Unsupported id prefix' });
  } catch (err) {
    res.status(500).json({ error: 'Fetch failure', detail: err.message });
  }
});

// Start server (PORT from Render)
app.listen(PORT, () => console.log(`MCP Health Server running on port ${PORT}`));