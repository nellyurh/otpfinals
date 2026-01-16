from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "port": os.environ.get("PORT", "not set"),
        "mongo_url_exists": bool(os.environ.get("MONGO_URL"))
    }

@app.get("/api/test")
def test():
    return {"test": "success"}
