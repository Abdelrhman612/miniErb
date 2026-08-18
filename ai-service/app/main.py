from fastapi import FastAPI
from app.api.routes import health
from app.core.config import settings

app = FastAPI(
    title="Mini ERP AI Service",
    description="Standalone Python FastAPI service for Mini ERP AI capabilities",
    version="1.0.0"
)

app.include_router(health.router)

@app.get("/")
def read_root():
    return {
        "service": "Mini ERP AI Service",
        "status": "running"
    }
