# Repository Guidelines

## Project Structure & Module Organization
This repository is a monorepo consisting of a **FastAPI backend** and a **React frontend** built with **Vite**.

- **`backend/`**: Contains the Python FastAPI application.
  - `main.py`: Entry point for the API and router registration.
  - `routes/`: FastAPI route modules for road fetching, road-status analysis, and routing.
  - `services/osm_service.py`: Fetches drivable roads from OpenStreetMap and returns GeoJSON.
  - `services/analysis_service.py`: Deterministic road status engine using disaster radii and Haversine distance.
- **`frontend/`**: Contains the React application using **Tailwind CSS v4** and **Zustand**.
  - `src/components/`: Modular UI components (MapComponent, Sidebar, Controls, Legend).
  - `src/store/`: State management via `useAppStore.js`.
  - `src/services/`: API communication layer (`api.js`).
  - `src/components/MapComponent.jsx`: Renders the base road network, blocked-road overlay, and evacuation route using Mapbox GL.

## Build, Test, and Development Commands

### Backend (FastAPI)
- **Install dependencies**: `cd backend && pip install -r requirements.txt`
- **Run server**: `python main.py` (Runs at `http://localhost:8000` with hot-reload enabled).
- **Road status endpoint**: `POST /api/roads/status` with GeoJSON roads plus disaster definitions.

### Frontend (React/Vite)
- **Install dependencies**: `cd frontend && npm install`
- **Run dev server**: `npm run dev` (Typically runs at `http://localhost:5173`).
- **Build production**: `npm run build`
- **Lint code**: `npm run lint`

## Coding Style & Naming Conventions

### Python (Backend)
- Use **FastAPI** and **Pydantic** for API models.
- Internal helper functions should be prefixed with an underscore (e.g., `_fetch_overpass_data`).
- Maintain explicit type hinting for function parameters and return types.
- Preserve compatibility with the current GeoJSON road format: road coordinates are stored as `[lon, lat]`.

### JavaScript/React (Frontend)
- Use **Zustand** for global state management; avoid prop-drilling.
- Styles are managed via **Tailwind CSS v4** with a focus on Glassmorphism UI patterns.
- Follow **ESLint** rules: `no-unused-vars` is enforced but ignores variables starting with uppercase or underscores (`^[A-Z_]`).
- Use `axios` for API requests, centralized in `src/services/api.js`.
- Keep the raw road network and the colorized road-status overlay as separate state objects (`roadsData` and `roadsGeoJSON`) so the overlay can be toggled without losing the fetched OSM geometry.
- Map overlays should continue to respect GeoJSON coordinate order `[longitude, latitude]`.

## Testing Guidelines
There is currently no testing framework configured in this repository. Ensure manual verification of UI flows and API responses before submitting changes.
- For map features, verify road colors for `blocked`, `risky`, and `safe`, confirm overlay toggle behavior, and check dynamic refresh after disaster-radius changes.

## Commit & Pull Request Guidelines
- Follow descriptive commit message patterns (e.g., `Refactor frontend UI to Tailwind v4 and Zustand`).
- Avoid "temporary commit" or "checkout" messages in the final history.
