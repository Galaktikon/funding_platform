from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils import auth

app = FastAPI(title="Funding Backend")

# Allow frontend hosted on Render static site
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # more strict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
def root():
    return {"status": "Backend running on Render"}