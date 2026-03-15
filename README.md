# QuantDesk

QuantDesk is a professional trading intelligence and simulation platform featuring a modern modular layout, virtual wallet execution, and live market data simulation.

## Components Built

- **Backend Architecture**: FastAPI with PostgreSQL, Redis, RESTful API and WebSocket engine.
- **Frontend Architecture**: React, Vite, TypeScript, with dynamic CSS Grid dockable layout for a Trade Terminal. Features beautiful custom Tailwind "dark trading" color pallets, pseudo-functional order matching UI, wallet manager, custom routing, and authentication flow UI.

## Local Setup

Ensure that Docker & Docker-Compose are installed on your machine.
Because this project was recovered after a PC restart, all dependencies are fully contained within the docker-compose setup.

### 1. Start Services

Open a terminal in this directory and run:
```bash
docker-compose up -d --build
```
This builds both the FastAPI back-end and the modern React front-end, provisioning databases required. 

*(Note: Depending on your system the initial NPM install within Docker might take 1-3 minutes.)*

### 2. Access the Application

- **Web UI:** Available at `http://localhost:5173`
- **Backend API Docs:** Available at `http://localhost:8000/docs`

### Troubleshooting
If the frontend says `Cannot find module` or dependencies are missing:
Since there's no native NPM folder outside Docker, standard IDE linters might complain. Run `npm install` locally when possible. But for testing, accessing it via your browser through Docker handles everything automatically.
