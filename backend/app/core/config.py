"""Core configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://quantdesk:quantdesk@localhost:5432/quantdesk"
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    # Auth
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # External APIs
    BINANCE_WS_URL: str = "wss://stream.binance.com:9443/ws"
    ALPHA_VANTAGE_API_KEY: str = ""
    NEWS_API_KEY: str = ""
    # Demo
    DEMO_BALANCE: float = 100000.0

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
