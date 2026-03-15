"""WebSocket service for real-time market data streaming."""
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """Manages WebSocket connections for real-time data streaming."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast(self, channel: str, data: dict):
        if channel in self.active_connections:
            dead = set()
            for ws in self.active_connections[channel]:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.active_connections[channel].discard(ws)


manager = ConnectionManager()


async def stream_binance_prices():
    """Connect to Binance WebSocket and broadcast price updates."""
    import aiohttp

    symbols = ["btcusdt", "ethusdt", "bnbusdt", "solusdt", "xrpusdt",
               "adausdt", "dogeusdt", "avaxusdt", "dotusdt", "maticusdt"]
    streams = "/".join([f"{s}@ticker" for s in symbols])
    url = f"wss://stream.binance.com:9443/stream?streams={streams}"

    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url) as ws:
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            if "data" in data:
                                ticker = data["data"]
                                payload = {
                                    "type": "ticker",
                                    "symbol": ticker.get("s", ""),
                                    "price": float(ticker.get("c", 0)),
                                    "change": float(ticker.get("P", 0)),
                                    "volume": float(ticker.get("q", 0)),
                                    "high": float(ticker.get("h", 0)),
                                    "low": float(ticker.get("l", 0)),
                                }
                                # Update cache
                                from app.services.market_data import _price_cache
                                crypto = _price_cache.get("crypto", {})
                                crypto[payload["symbol"]] = {
                                    "symbol": payload["symbol"],
                                    "price": payload["price"],
                                    "change_24h": payload["change"],
                                    "volume_24h": payload["volume"],
                                    "high_24h": payload["high"],
                                    "low_24h": payload["low"],
                                }
                                _price_cache["crypto"] = crypto
                                await manager.broadcast("market", payload)
                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            break
        except Exception:
            await asyncio.sleep(5)  # Reconnect after 5s
