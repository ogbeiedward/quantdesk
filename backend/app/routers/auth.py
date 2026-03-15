"""Authentication router — signup, login, password reset."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import get_settings
from app.models.models import User, Wallet
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut, PasswordReset

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check existing
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already taken")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.flush()

    # Create demo wallets
    for currency, balance in [("USD", settings.DEMO_BALANCE), ("BTC", 0), ("ETH", 0), ("EUR", 0)]:
        db.add(Wallet(user_id=user.id, currency=currency, balance=balance))

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password")
async def forgot_password(data: PasswordReset, db: AsyncSession = Depends(get_db)):
    # In production, send email with reset token
    return {"message": "If an account with that email exists, a reset link has been sent."}
