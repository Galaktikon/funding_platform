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
    print(payload)

    try:
        result = supabase.auth.sign_up({"email": payload.email, "password": payload.password}),
                                 
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    print(result)

    if not result.user:
        raise HTTPException(status_code=400, detail="Signup failed: no user returned")

    
    try:
        new_user = (
            supabase
                .table("users")
                .insert({
                    "id": result.user.id,
                    "email": payload.email,
                    "is_admin": "false",
                    "name": payload.fullName,
                })
                .execute()
        )
        print("User inserted into table:", new_user)
    except Exception as e:
        print("Error creating user:", e)
        raise HTTPException(status_code=500, detail="Failed to create user")

    return {"message": "Signup successful, check email for verification."}

@router.post("/signin")
def signin(payload: AuthRequest):
    try:
        result = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Supabase login error: {e}")

    if not result.user:
        raise HTTPException(status_code=400, detail="Login failed: invalid credentials")

    return {
        "message": "Login successful",
        "user": {
            "id": result.user.id,
            "email": result.user.email
        },
        "session": result.session
    }

class SessionPayload(BaseModel):
    access_token: str

@router.post("/me")
def get_me(payload: SessionPayload):
    token = payload.access_token
    if not token:
        raise HTTPException(status_code=400, detail="Missing access token")

    try:
        # Validate/verify token using supabase.auth.get_user()
        user_response = supabase.auth.get_user(token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Supabase login error: {e}")

    if not user_response.user:
        raise HTTPException(status_code=400, detail="Login failed: invalid credentials")

    auth_user = user_response.user
    print("Auth User: ", auth_user)
    
        # Next: lookup role in your public users table
    response = supabase.table("users").select("*").eq("id", auth_user.id).single().execute()
    print("Response: ", response)

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found in public users table")

    user = response.data
    print("User: ", user)
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["is_admin"]
    }
