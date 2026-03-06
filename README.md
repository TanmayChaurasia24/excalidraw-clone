# Eraser.io Clone

A full-stack, enterprise-grade, real-time collaborative whiteboarding application. Built with Next.js, WebSockets, Redis, and PostgreSQL, orchestrated via Docker & Nginx.

## Architecture

![Architecture](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nginx_logo.svg/1024px-Nginx_logo.svg.png)

This application employs a high-performance, horizontally scaled backend to ensure low-latency real-time collaboration.

### Core Technologies

- **Frontend**: Next.js (React), Rough.js (Stylized Canvas drawing), TailwindCSS.
- **REST API**: Node.js/Express (`http-backend` for static data and authentication).
- **WebSockets Engine**: Node.js/ws (`ws-backend` for handling live canvas element pushes).
- **Message Broker & Pub/Sub**: Redis Cloud (Used for Global Event Broadcasting and Queueing).
- **Load Balancer**: NGINX Reverse Proxy (Layer 7 routing with sticky sessions).
- **Database**: PostgreSQL (NeonDB), managed with Prima ORM.
- **Background Worker**: Node.js Worker process consuming Redis Queues to decouple high-frequency writes.
- **Containerization**: Docker & Docker Compose (`node:20-alpine` based).

## Distributed System Design

1. **Load Balancing**: The Next.js client connects via secure WebSocket (`wss://`) to an **NGINX Reverse Proxy** router. Using `ip_hash` sticky sessions, clients are partitioned evenly across 3 independently running WebSocket servers.
2. **Real-time Sync**: When "User A" drawing on `Node 1` draws a circle, `Node 1` pushes a `global_canvas_updates` payload to a **Redis Pub/Sub** bus. `Node 2` and `Node 3` instantly receive this internal pub/sub event and broadcast the canvas coordinates downstream to any connected peers.
3. **Queue Processing**: To prevent heavy SQL transactions from blocking the event loop on every mouse stroke, WebSocket servers push completed drawings into a `canvas_elements` Redis List. A secure **Background Worker Process** `blpop`s the events from the queue asynchronously and executes batch upset/delete transactions on the PostgreSQL database via Prisma ORM.

## How to Run locally

### 1. Configure Envs

Create a `.env` file at the root of the project with the following secrets:

```bash
DATABASE_URL='postgresql://<user>:<password>@<domain>.tech/neondb?sslmode=require&channel_binding=require'
JWT_SECRET='your_super_secret_jwt_string'
REDIS_URL='redis://default:<password>@<domain>.redislabs.com:<port>'
```

### 2. Docker Compose Launch

The entire infrastructure (Load Balancer, 3 WS-Servers, HTTP-API, and Worker) is defined as a scalable multi-container Compose setup. From the root repository, simply boot up the distributed ecosystem:

```bash
docker compose up -d --build
```

_Note: Because Docker uses Alpine Linux underneath, the Docker builder automatically hooks into TurboRepo, generating cross-platform Prisma engines natively._

### 3. Start Frontend Client

In a separate terminal, launch the Next.js React frontend to interact with the Dockerized backend:

```bash
pnpm install
pnpm dev
```

Navigate to `http://localhost:3000` to start drawing!

---

_(Note: To gracefully spin down all Docker containers locally, invoke `docker compose down`)_
