from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables before importing routes/services
load_dotenv()

from routes import roads, analyze, route

app = FastAPI(title="Disaster Response AI - Backend")

# Allow CORS for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api prefix (matches frontend API calls)
app.include_router(roads.router, prefix="/api", tags=["Roads"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(route.router, prefix="/api", tags=["Routing"])

# Also mount at root for direct endpoint access
app.include_router(roads.router, tags=["Roads"])
app.include_router(analyze.router, tags=["Analysis"])
app.include_router(route.router, tags=["Routing"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Disaster Response AI Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
