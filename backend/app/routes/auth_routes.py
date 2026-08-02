"""
routes/auth_routes.py — Register & Login endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Create a new user account and return an access token.
    """
    if not payload.email or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    email_lower = payload.email.strip().lower()
    existing = db.query(models.User).filter(models.User.email == email_lower).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = models.User(
        email=email_lower,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email})
    return schemas.TokenResponse(access_token=token, email=user.email)

@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate and return an access token.
    """
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    email_lower = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_lower).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(data={"sub": user.email})
    return schemas.TokenResponse(access_token=token, email=user.email)

@router.get("/me", response_model=schemas.UserResponse)
def get_me(
    current_user: models.User = Depends(
        __import__("app.auth", fromlist=["get_current_user"]).get_current_user
    ),
):
    """
    Return the currently authenticated user.
    """
    return current_user
