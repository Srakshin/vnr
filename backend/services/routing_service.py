import requests
import logging

def get_route(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> dict:
    """
    Call OSRM API to get the optimal route.
    http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}
    """
    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
    params = {
        "overview": "full",
        "geometries": "geojson"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get("code") != "Ok":
            raise ValueError(f"OSRM returned code: {data.get('code')}")
            
        routes = data.get("routes", [])
        if not routes:
            raise ValueError("No routes found")
            
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
        logging.error(f"Error fetching route: {e}")
        raise
