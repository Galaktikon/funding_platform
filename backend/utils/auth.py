from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

router = APIRouter(prefix="/auth", tags=["auth"])

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(payload: AuthRequest):
    result = supabase.auth.sign_up({"email": payload.email, "password": payload.password})

    if result.get("error"):
        raise HTTPException(status_code=400, detail=str(result["error"]))

    return {"message": "Signup successful, check email for verification."}

@router.post("/signin")
def signin(payload: AuthRequest):
    result = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})

    if result.get("error"):
        raise HTTPException(status_code=400, detail=str(result["error"]))

    return {"message": "Login successful", "session": result.get("session")}