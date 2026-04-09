from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import random
import json

app = FastAPI(title="Disaster Response AI Simulator")

# Allow all CORS for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    roads: dict

@app.get("/api/roads")
def get_roads(lat: float, lon: float, radius: int = 500):
    """
    Fetch road data from Overpass API within a radius of lat, lon.
    We format the output as GeoJSON directly or parse the OSM node data into a simpler GeoJSON format.
    """
    # Overpass QL query: get all highways (roads) around the lat/lon
    # out geom will output geometry for ways so we don't have to fetch node coordinates manually.
    overpass_query = f"""
    [out:json][timeout:25];
    way["highway"](around:{radius},{lat},{lon});
    out geom;
    """
    
    url = "http://overpass-api.de/api/interpreter"
    
    try:
        response = requests.post(url, data={'data': overpass_query})
        response.raise_for_status()
        osm_data = response.json()
        
        # Convert to a simple GeoJSON FeatureCollection
        features = []
        for element in osm_data.get("elements", []):
            if element.get("type") == "way" and "geometry" in element:
                coords = [[node["lon"], node["lat"]] for node in element["geometry"]]
                
                # Filter out points/broken ways
                if len(coords) < 2:
                    continue
                    
                feature = {
                    "type": "Feature",
                    "properties": {
                        "id": element.get("id"),
                        "name": element.get("tags", {}).get("name", "Unknown Road"),
                        "highway": element.get("tags", {}).get("highway", "unknown"),
                        "status": "unknown"
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    }
                }
                features.append(feature)
                
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        return geojson
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
def analyze_roads(payload: AnalyzeRequest):
    """
    Simulate AI detecting blocked vs accessible roads.
    Randomly assigns ~30% of roads as 'blocked' and the rest as 'accessible'.
    """
    roads = payload.roads
    if "features" not in roads:
        raise HTTPException(status_code=400, detail="Invalid GeoJSON FeatureCollection")
        
    for feature in roads["features"]:
        # 30% chance a road is considered blocked in the simulated disaster
        if random.random() < 0.30:
            feature["properties"]["status"] = "blocked"
        else:
            feature["properties"]["status"] = "accessible"
            
    return roads

@app.get("/api/route")
def get_route(start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    """
    Fetch a route from standard OSRM. Since standard OSRM doesn't easily support excluding segments,
    this serves as finding the "best option" among alternatives, or simply returns the route to simulate the optimal path.
    """
    # Use alternatives=true to get a few routes if possible
    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&alternatives=true"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get("code") != "Ok":
            raise HTTPException(status_code=400, detail="No route found by OSRM")
            
        routes = data.get("routes", [])
        if not routes:
            raise HTTPException(status_code=404, detail="No route found")
            
        # For simplicity in demo, we grab the first suggested route.
        # In a more advanced simulate, we'd pick the alternative that intersects fewer blocked roads.
        best_route = routes[0]
        
        return {
            "type": "Feature",
            "properties": {
                "distance": best_route.get("distance"),
                "duration": best_route.get("duration"),
                "type": "optimal_route"
            },
            "geometry": best_route.get("geometry")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
