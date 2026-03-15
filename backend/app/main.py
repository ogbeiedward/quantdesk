"""QuantDesk FastAPI Application — Main entry point."""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.routers import auth, users, wallet, trading, market, watchlist, strategies, admin, analytics
from app.services.websocket_service import manager, stream_binance_prices


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    # Start Binance WebSocket stream in background
    task = asyncio.create_task(stream_binance_prices())
    yield
    # Shutdown
    task.cancel()


app = FastAPI(
    title="QuantDesk API",
    description="Professional Trading Intelligence & Simulation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(wallet.router)
app.include_router(trading.router)
app.include_router(market.router)
app.include_router(watchlist.router)
app.include_router(strategies.router)
app.include_router(admin.router)
app.include_router(analytics.router)


# WebSocket endpoint
@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    await manager.connect(websocket, "market")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "market")


@app.get("/")
async def root():
    return {"name": "QuantDesk API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
