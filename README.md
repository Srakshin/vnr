# Disaster Response AI Simulator (Demo)

A lightweight demo web application simulating AI-based road accessibility detection from satellite imagery for disaster response.

## 🧱 Tech Stack
- **Frontend**: React (Vite), Mapbox GL JS, Vanilla CSS (Glassmorphism UI)
- **Backend**: FastAPI
- **APIs**: Overpass API (OSM roads), OSRM API (routing)

## 📦 Setup Instructions

There are two separate servers you need to run for this application: the backend API and the frontend UI.

### 1. Backend Setup

1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```
   *The server will run at `http://localhost:8000`.*

### 2. Frontend Setup

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open in your browser (typically `http://localhost:5173`).*

## 🔄 Demo Flow
- The frontend will load a satellite map centered on a default location.
- **Acquire Data**: Click "Load Nearby Roads" to fetch all road segments in the area from OpenStreetMap via the FastAPI backend.
- **Analyze Disaster**: Click "Analyze Disaster Area". The backend simulates an AI evaluation and randomly flags ~30% of roads as blocked (red) due to the simulated disaster, leaving the rest accessible (green).
- **Find Route**: Click "Find Safe Evacuation Route". Then, select a start and an end destination on the map. The backend queries OSRM for the optimal driving route and displays the evacuation path.
