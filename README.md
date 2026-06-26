# CogniDispatch Vendor Service

The **Vendor Service** is the contractor and responder-matching microservice within the **CogniDispatch** platform. It handles contractor availability states, performs geographic search lookups using the Haversine formula, and identifies the absolute closest technician within a 10km radius of an emergency incident.

## 🚀 Technology Stack
*   **Runtime**: Node.js (v18+)
*   **Web Framework**: Express.js
*   **Security & Networking**: CORS, Helmet
*   **Mathematical Utilities**: Haversine Formula for geo-matching

---

## 📁 Repository Structure
```
├── controllers/          # Express route controllers (Vendor matching logic)
│   └── vendorController.js # Matching algorithms and contractor status queries
├── shared/               # Database adapter and schema configurations
├── Dockerfile            # Container build specification
├── package.json          # Node dependencies
└── server.js             # Entry point
```

---

## ⚙️ Environment Variables & Config

This service requires database connectivity. It reads the following parameters:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Listening TCP Port for the service | `5002` |
| `MONGODB_URI_FILE` | Path to file containing Cosmos DB connection string | *None* |

---

## 🛣️ API Endpoints

All routes are prefixed with `/api/vendors`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/vendors/health` | Service health status check |
| **POST** | `/api/vendors/match` | Accepts client location and category, finds the nearest online/available contractor within a 10km radius using the Haversine formula, flags them as busy, and returns the technician profile |
| **GET** | `/api/vendors/active-job/:id` | Returns details of any currently active dispatch job assigned to a specific vendor ID |
| **PUT** | `/api/vendors/complete-job` | Updates vendor job stats and completes a dispatch record |

---

## 🛠️ Local Development

### 1. Prerequisites
*   Node.js (v18+)
*   A running local MongoDB instance (or Cosmos DB emulator)

### 2. Startup Commands
From the service root:
```bash
# Install dependencies
npm install

# Run the development server
npm start
```
The server will start listening at `http://localhost:5002/`.

---

## 🐳 Docker Container Build

```bash
docker build -t cogniregistry.azurecr.io/cogni-vendor-service:latest .
```
