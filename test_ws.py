import asyncio
import websockets

async def test():
    uri = "wss://quantdesk-api-5vu4.onrender.com/ws/market"
    try:
        async with websockets.connect(uri) as ws:
            print("Connected successfully!")
            await asyncio.sleep(2)
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test())
