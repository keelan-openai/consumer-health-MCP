# Health MCP Server

Minimal Model Context Protocol (MCP) compatible service exposing three endpoints:

| Endpoint | Method | Purpose | Required by connector |
|----------|--------|---------|-----------------------|
| `/search` | POST | Search mock records; returns brief results | Yes |
| `/fetch`  | POST | Fetch full record by `id` | Yes |
| `/nbodyspec` | POST | Compute body metrics (BMI + category) | No (custom) |

> Only `POST /search` and `POST /fetch` are required for the ChatGPT connector validator. The extra `/nbodyspec` route is optional utility logic.

## Quick Start

```bash
npm install
npm start
```

Smoke test:

```bash
bash scripts/smoke.sh
```

## Example Requests

Search (empty query returns all):

```bash
curl -X POST http://localhost:3000/search -H 'Content-Type: application/json' -d '{}'
```

Fetch:

```bash
curl -X POST http://localhost:3000/fetch -H 'Content-Type: application/json' -d '{"id":"bp-001"}'
```

Body spec:

```bash
curl -X POST http://localhost:3000/nbodyspec -H 'Content-Type: application/json' -d '{"height":180,"weight":75,"age":30}'
```

## Deploy (Render)

1. New Web Service → **Node**.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Expose port `PORT` (Render sets it automatically).
5. Test base URL: `curl https://<your-service>.onrender.com/`

## Manifest

See `manifest.json` (simple operations list). If you prefer OpenAPI, use `openapi.yaml` and generate manifest programmatically.

## Contract Shape

**/search**

Request:
```json
{ "query": "blood" }
```
Response:
```json
{
  "results": [
    { "id": "bp-001", "title": "Blood Pressure Basics", "description": "Normal adult resting blood pressure ~120/80 mmHg." }
  ]
}
```

**/fetch**

Request:
```json
{ "id": "bp-001" }
```
Response:
```json
{
  "id": "bp-001",
  "title": "Blood Pressure Basics",
  "content": "Normal adult resting blood pressure ~120/80 mmHg.",
  "tags": ["vitals","cardio"]
}
```

**/nbodyspec**

Request:
```json
{ "height": 180, "weight": 75 }
```

Response excerpt:
```json
{ "bmi": "23.15", "category": "Normal" }
```

## Extending

Replace the in-memory `DATA` array with a DB or external API. Ensure result objects keep stable `id`s; only extend fields (avoid renaming) to stay backward compatible.

## License

MIT
