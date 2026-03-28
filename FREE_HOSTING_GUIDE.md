# QuantDesk Free Forever Deployment Guide 🚀

To host your Bloomberg-grade terminal for **$0.00/month** forever, follow these 3 steps. I have already pushed the required code to your GitHub.

---

### Step 1: Database (Neon.tech)
1. Go to [Neon.tech](https://neon.tech) and create a free account.
2. Create a project named `quantdesk`.
3. Copy the **Connection String** (it starts with `postgresql://...`).
4. Keep this for Step 2.

---

### Step 2: Backend API (Render.com)
1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Click **New +** -> **Web Service**.
3. Select your `quantdesk` repository.
4. **Settings**:
   - **Name**: `quantdesk-api`
   - **Environment**: `Docker`
   - **Plan**: `Free`
5. Click **Advanced** and add these **Environment Variables**:
   - `DATABASE_URL`: (Paste your Neon string here, but change `postgresql://` to `postgresql+asyncpg://`)
   - `SECRET_KEY`: `any-random-string-123`
   - `ALPHA_VANTAGE_API_KEY`: (Your key)
   - `CORS_ORIGINS`: `*`
6. Click **Create Web Service**. 
   *Note: Render Free Tier "sleeps" after 15 mins of inactivity, it will take ~30s to wake up when you visit.*

---

### Step 3: Frontend UI (Vercel)
1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New** -> **Project**.
3. Import your `quantdesk` repository.
4. **Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
5. **Environment Variables**:
   - `VITE_API_URL`: (Paste your Render URL, e.g., `https://quantdesk-api.onrender.com`)
6. Click **Deploy**.

---

### Why this is better:
- **Zero Cost**: No Azure credits used.
- **Auto-Update**: Every time you push to GitHub, Render and Vercel will update automatically.
- **Global**: Your terminal will be accessible from any device in the world.
