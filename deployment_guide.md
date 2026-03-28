# QuantDesk Deployment Guide

This guide covers how to host your Bloomberg-grade QuantDesk terminal for free or using your existing Azure setup.

---

## 🚀 Option 1: Free Forever Stack (Recommended)
This path costs exactly **$0.00/month** and uses specialized free tiers for each layer.

### 1. Database (Neon.tech)
- **Service**: Managed Serverless Postgres.
- **Setup**: Create a free account at [Neon.tech](https://neon.tech), create a project, and copy the **Connection String** (Direct connection).
- **Endpoint**: `postgresql://user:pass@ep-hostname.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 2. Backend API (Render.com)
- **Service**: Web Service (Free Tier).
- **Setup**: Connect your GitHub repo. Set Root Directory to `backend`.
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
- **Envs**: Add `DATABASE_URL`, `SECRET_KEY`, `ALPHA_VANTAGE_API_KEY`, etc.
- **Note**: The free tier "spins down" after 15 mins of inactivity. It takes ~30s to wake up on first load.

### 3. Frontend (Vercel)
- **Service**: Frontend hosting.
- **Setup**: Connect GitHub repo. It will auto-detect Vite.
- **Envs**: Set `VITE_API_URL` to your Render `.onrender.com` URL.

---

## 🏢 Option 2: Azure Institutional Stack
You have already started this! This path is more powerful but will count against your **$200 Azure Credits**.

### 1. Azure App Service (Web App for Containers)
- **Service**: Azure App Service (App Service for Containers).
- **Plan**: Use the **F1 (Free)** or **B1 (Basic)** Linux plan in Sweden Central.
- **Setup**: You have `deploy_webapp.ps1` which creates a multi-container app using `docker-compose.prod.yml`.

### 2. GitHub Actions Automation
I have updated your `.github/workflows/azure-deploy.yml` to automatically signal Azure to restart and pull new images whenever you push to `master`.

### 3. Database
For Azure, it's recommended to use **Azure Database for PostgreSQL (Flexible Server)**, which has a free 12-month trial. Use the same credentials in your Web App environment variables.

---

## 🛠️ Essential Configuration
Ensure both `frontend` and `backend` use the correct URLs:
- **Backend**: Set `CORS_ORIGINS` to your frontend URL.
- **Frontend**: Set `VITE_API_URL` to your backend URL.
- **Database**: Run migrations (`alembic upgrade head`) on your production DB once.
