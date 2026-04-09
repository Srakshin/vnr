"""
AI-Powered Road Damage Analysis Service

Uses Google Gemini Vision API to analyze satellite imagery and determine
road accessibility. Replaces the random simulation with real AI inference.
"""

import os
import json
import base64
import logging
from google import genai
from services.satellite_service import fetch_satellite_image, get_tile_configs

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def _build_road_list_for_prompt(features: list, road_indices: list) -> str:
    """
    Build a numbered list of road names/types for the Gemini prompt,
    so the AI can reference specific roads in its response.
    """
    lines = []
    for idx in road_indices:
        feat = features[idx]
        props = feat.get("properties", {})
        name = props.get("name", "Unknown Road")
        highway_type = props.get("highway", "unknown")
        lines.append(f"  Road #{idx}: \"{name}\" (type: {highway_type})")
    return "\n".join(lines)


def _analyze_tile_with_gemini(image_bytes: bytes, road_descriptions: str,
                              road_indices: list) -> dict:
    """
    Send a satellite image + road descriptions to Gemini Vision API.
    Returns a mapping of road_index -> {status, confidence, damage_type}.
    """
    client = genai.Client(api_key=GEMINI_API_KEY)

    # Encode image as base64 for the API
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = f"""You are an AI disaster response analyst examining satellite imagery to assess road conditions after a natural disaster.

Analyze this satellite image and determine the accessibility status of each road listed below.

**Roads in this area:**
{road_descriptions}

**For each road, evaluate:**
1. Is there visible flooding, water coverage, or waterlogging on or near the road?
2. Is there debris, fallen trees, or structural collapse blocking the road?
3. Are there landslide indicators (earth/rock movement) covering the road?
4. Does the road surface appear intact and passable?

**IMPORTANT:** Respond ONLY with a valid JSON array. No markdown, no explanation. Each element must have:
- "road_id": the road number (integer)
- "status": "blocked" or "accessible"  
- "confidence": a float between 0.0 and 1.0
- "damage_type": one of "flooding", "debris", "collapse", "landslide", "none"

Example format:
[{{"road_id": 0, "status": "accessible", "confidence": 0.85, "damage_type": "none"}}]

Analyze realistically based on what you observe in the satellite image. In post-disaster scenarios approximately 20-40% of roads may be affected. Look carefully for signs of damage.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": image_b64
                            }
                        }
                    ]
                }
            ]
        )

        response_text = response.text.strip()
        logger.info(f"Gemini raw response: {response_text[:500]}")

        # Clean up response - remove markdown code fences if present
        if response_text.startswith("```"):
            # Remove opening fence
            first_newline = response_text.index("\n")
            response_text = response_text[first_newline + 1:]
            # Remove closing fence
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        results = json.loads(response_text)

        # Build mapping
        analysis_map = {}
        for item in results:
            road_id = item.get("road_id")
            if road_id is not None:
                analysis_map[road_id] = {
                    "status": item.get("status", "accessible"),
                    "confidence": item.get("confidence", 0.5),
                    "damage_type": item.get("damage_type", "none")
                }

        return analysis_map

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        logger.error(f"Response was: {response_text[:1000]}")
        # Fallback: mark all as accessible with low confidence
        return {idx: {"status": "accessible", "confidence": 0.3, "damage_type": "none"}
                for idx in road_indices}
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise


def analyze_roads_with_ai(geojson: dict) -> dict:
    """
    Main analysis function. Orchestrates the end-to-end AI pipeline:
    1. Group roads into spatial tiles
    2. Fetch satellite imagery for each tile
    3. Send to Gemini Vision for analysis
    4. Map AI results back to GeoJSON features
    """
    features = geojson.get("features", [])
    if not features:
        return geojson

    logger.info(f"Starting AI analysis of {len(features)} road segments")

    # Step 1: Group roads into spatial tiles
    tiles = get_tile_configs(geojson)
    logger.info(f"Split roads into {len(tiles)} spatial tiles")

    # Step 2 & 3: For each tile, fetch satellite image and analyze
    all_results = {}
    for i, tile in enumerate(tiles):
        logger.info(f"Processing tile {i + 1}/{len(tiles)} with {len(tile['road_indices'])} roads")

        # Fetch satellite image for this tile
        image_bytes = fetch_satellite_image(
            center_lat=tile["center_lat"],
            center_lon=tile["center_lon"],
            zoom=tile["zoom"]
        )

        # Build road descriptions for the prompt
        road_descriptions = _build_road_list_for_prompt(features, tile["road_indices"])

        # Analyze with Gemini
        tile_results = _analyze_tile_with_gemini(
            image_bytes=image_bytes,
            road_descriptions=road_descriptions,
            road_indices=tile["road_indices"]
        )
        all_results.update(tile_results)

    # Step 4: Map results back to GeoJSON features
    for i, feature in enumerate(features):
        if "properties" not in feature:
            feature["properties"] = {}

        if i in all_results:
            result = all_results[i]
            feature["properties"]["status"] = result["status"]
            feature["properties"]["confidence"] = result["confidence"]
            feature["properties"]["damage_type"] = result["damage_type"]
        else:
            # Roads not analyzed default to accessible with low confidence
            feature["properties"]["status"] = "accessible"
            feature["properties"]["confidence"] = 0.3
            feature["properties"]["damage_type"] = "none"

    blocked_count = sum(1 for f in features if f["properties"]["status"] == "blocked")
    logger.info(f"AI analysis complete: {blocked_count}/{len(features)} roads blocked")

    return geojson
