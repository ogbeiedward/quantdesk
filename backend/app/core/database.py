"""Async SQLAlchemy database setup."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
connect_args = {}

# Neon and asyncpg compatibility: strip query parameters and explicitly set SSL
if "?" in db_url:
    db_url = db_url.split("?")[0]
    
if "neon.tech" in settings.DATABASE_URL or "sslmode=require" in settings.DATABASE_URL:
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ctx

engine = create_async_engine(db_url, echo=False, pool_size=20, max_overflow=10, connect_args=connect_args)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)




class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
