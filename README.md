# LiveBid - Real-Time Auction Platform

**LiveBid** is a high-performance, real-time auction system designed for scale and transactional safety. It ensures fair bidding through strict concurrency controls and provides instant feedback via WebSockets.

## Key Features

- **Real-Time Bidding**: Instant updates for all participants via WebSocket.
- **Financial Safety**: robust escrow system that reserves funds upon bidding and refunds outbid users instantly.
- **Transactional Integrity**: Pessimistic locking guarantees that no two bids conflict, even under high concurrency.
- **Automated Settlement**: Auctions close automatically, and funds are transferred to the seller immediately.
- **Simulation Tools**: Includes a CLI for simulating bidding wars and stress testing the engine.

## Tech Stack

- **Core**: Java 21, Spring Boot 3
- **Data**: PostgreSQL (Persistence), Redis (Caching & Pub/Sub)
- **Messaging**: WebSocket
- **Containerization**: Docker & Docker Compose

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Java 21 (optional, for local dev)
- Python 3 (optional, for CLI)

### 2. Launch Infrastructure
Start the database and caching services:
```bash
docker-compose up -d
```

### 3. Run the Application
You can run the application directly using Maven:
```bash
# MacOS/Linux
./mvnw spring-boot:run
```

The server will start on `http://localhost:8080`.

### 4. Run the Frontend
Navigate to `livebid-ui` and start the dev server:
```bash
cd livebid-ui
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## Usage & Tools

### Interactive CLI
We provide a powerful CLI tool to simulate users and auctions.
```bash
# Navigate to project root
pip install -r requirements.txt
python cli.py
```
**Features**:
- Create Users with toy balances.
- Start/View Auctions.
- **Simulate Bid War**: Spawns multiple bot bidders to stress test the system.

### Real-Time Client
Open `test-client.html` in your web browser to connect to the WebSocket stream and view live updates as they happen.

## API Documentation
The API is designed around RESTful principles.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a new user |
| POST | `/auctions` | Create a new auction |
| POST | `/auctions/{id}/start` | Open an auction for bidding |
| POST | `/auctions/{id}/bids` | Place a bid (requires valid user) |
| GET | `/auctions/{id}` | Get real-time auction status |

---
