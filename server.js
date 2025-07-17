const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

function readData(file) {
  const dataPath = path.join(__dirname, 'data', file);
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

app.get('/', (req, res) => {
  res.send({ status: "MCP Health Server is running" });
});

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

app.listen(PORT, () => {
  console.log(`MCP Health Server running on port ${PORT}`);
});