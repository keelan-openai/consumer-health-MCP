# Consumer Health MCP Server

This project is a **Model Context Protocol (MCP) server** designed for the Consumer Health Companion hackathon project. 
It aggregates mock health data (labs, medications, doctor visits) and exposes endpoints for integration with ChatGPT tools.

---

## **Features**
- **Endpoints:** 
  - `/labs` – Get mock lab results
  - `/medications` – Get current medications
  - `/doctor-prep` – Summary of last doctor visit
- **Mock Data** stored in `/data/` directory (FHIR-style JSON)
- **Ready for deployment** on Render or Railway

---

## **Local Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/consumer-health-MCP.git
   cd consumer-health-MCP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the server locally:
   ```bash
   npm start
   ```

4. Test endpoints:
   - `http://localhost:3000/labs`
   - `http://localhost:3000/medications`
   - `http://localhost:3000/doctor-prep`

---

## **Deploying to Render**
1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Use the following settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Render will provide a public URL, e.g., `https://consumer-health-mcp.onrender.com`.

---

## **Project Structure**
```
consumer-health-MCP/
├── data/
│   ├── labs.json
│   ├── medications.json
│   └── visits.json
├── mcp-config.json
├── package.json
├── server.js
└── README.md
```

---

## **Next Steps**
- Replace mock data with real FHIR APIs or other connectors.
- Extend endpoints with authentication, patient timelines, and trends.
- Integrate with ChatGPT by pointing to these endpoints as MCP tools.

---
## BodySpec Integration (Single Account)

This server can pull **DEXA scan data from BodySpec** using a single account token.

### 1. Get Your BodySpec Token
- Log in to BodySpec’s auth portal.
- Copy your **JWT access token** (server-to-server recommended). 
- *Do NOT commit it to GitHub.*

### 2. Add Token in Render
In your Render service:
- Settings → Environment → Add Environment Variable  
  - **Key:** `BODYSPEC_TOKEN`  
  - **Value:** *your JWT string*

### 3. Endpoints Added
- `GET /bodyspec/results` — list scan results (paginated; offset/limit).
- `GET /bodyspec/results/:result_id/composition` — DEXA body composition by region.
- `GET /bodyspec/results/:result_id/scan-info` — scan acquisition metadata.

These wrap BodySpec’s REST API:
- `/api/v1/users/me/results/`
- `/api/v1/users/me/results/{result_id}/dexa/composition`
- `/api/v1/users/me/results/{result_id}/dexa/scan-info`

### 4. Test Locally
```
export BODYSPEC_TOKEN="paste-token-here"
npm start
curl -H "Authorization: Bearer test" http://localhost:3000/bodyspec/results
```

(The test Authorization header is optional; server uses env var.)
