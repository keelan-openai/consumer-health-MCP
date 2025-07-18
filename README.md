# Minimal Health MCP Server

**Purpose:** Smallest working example for ChatGPT connector validation.
Only implements required endpoints:

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| /search  | POST   | `{ "query": "optional" }` | `{ "results": [ { id, title, description, snippet } ] }` |
| /fetch   | POST   | `{ "id": "<id>" }` | `{ id, title, content }` |

## Run

```bash
npm install
npm start
```

## Test

```bash
# Empty search
curl -X POST http://localhost:3000/search -H "Content-Type: application/json" -d '{}'

# Search with query
curl -X POST http://localhost:3000/search -H "Content-Type: application/json" -d '{"query":"blood"}'

# Fetch
curl -X POST http://localhost:3000/fetch -H "Content-Type: application/json" -d '{"id":"bp-001"}'
```

## Manifest

`manifest.json` kept minimal (only search & fetch). No extra endpoints to avoid validator rejection.

