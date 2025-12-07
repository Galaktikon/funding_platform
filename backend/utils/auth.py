from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from .config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

router = APIRouter(prefix="/auth", tags=["auth"])

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class AuthRequest(BaseModel):
    email: str
    password: str
    fullName: str | None = None

@router.post("/signup")
def signup(payload: AuthRequest):
    print("Payload: " + payload)
    result = supabase.auth.sign_up({"email": payload.email, "password": payload.password})

    if result.get("error"):
        raise HTTPException(status_code=400, detail=str(result["error"]))
    print(result)
    try:
        new_user = (
            supabase
                .table("users")
                .insert({
                    "id": result.user.id,
                    "email": payload.email,
                    "admin": "true",
                    "name": payload.fullName,
                })
                .execute()
        )
        print(new_user)
    except Exception as e:
        print("Error creating user:", e)
        raise HTTPException(status_code=500, detail="Failed to create user")

    return {"message": "Signup successful, check email for verification."}

@router.post("/signin")
def signin(payload: AuthRequest):
    result = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})

    if result.get("error"):
        raise HTTPException(status_code=400, detail=str(result["error"]))

    return {"message": "Login successful", "session": result.get("session")}