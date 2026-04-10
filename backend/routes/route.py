from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.routing_service import get_route, get_smart_route

router = APIRouter()


class SmartRouteRequest(BaseModel):
    roads: dict[str, Any]
    start: tuple[float, float] = Field(..., min_length=2, max_length=2)
    end: tuple[float, float] = Field(..., min_length=2, max_length=2)


def _validate_geojson_roads(roads: dict[str, Any]) -> None:
    if roads.get("type") != "FeatureCollection" or "features" not in roads:
        raise HTTPException(status_code=400, detail="Invalid GeoJSON FeatureCollection")

@router.get("/route")
def calculate_route(start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    """
    Calculate route between start and end coordinates using OSRM.
    """
    try:
        route_geojson = get_route(start_lat, start_lon, end_lat, end_lon)
        return route_geojson
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get route: {str(e)}")


@router.post("/route/smart")
def calculate_smart_route(payload: SmartRouteRequest):
    """
    Compute a safety-aware route that excludes blocked roads and falls back to risky roads.
    """
    try:
        _validate_geojson_roads(payload.roads)
        return get_smart_route(
            roads_geojson=payload.roads,
            start=payload.start,
            end=payload.end,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to get smart route: {str(exc)}")
