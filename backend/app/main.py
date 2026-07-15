import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import datasets

app = FastAPI(title="Doctor Linda API", version="0.1.0")

# Frontend URL(s) allowed to call this API -- set FRONTEND_URL in Render's
# environment once the frontend is deployed on Vercel, e.g.
# "https://doctor-linda.vercel.app". Comma-separate multiple origins.
origins = [o.strip() for o in os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "doctor-linda-api"}
