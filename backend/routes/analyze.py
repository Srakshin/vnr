from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.analysis_service import analyze_roads_with_ai

router = APIRouter()

class AnalyzeRequest(BaseModel):
    roads: dict

@router.post("/analyze")
def analyze_roads(payload: AnalyzeRequest):
    """
    Analyze road accessibility using AI-powered satellite imagery analysis.
    Fetches satellite images for the road area and uses Gemini Vision to
    determine which roads are blocked vs accessible.
    """
    try:
        if "features" not in payload.roads:
            raise HTTPException(status_code=400, detail="Invalid GeoJSON FeatureCollection")
            
        analyzed_roads = analyze_roads_with_ai(payload.roads)
        return analyzed_roads
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
