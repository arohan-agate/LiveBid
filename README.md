# LiveBid - Real-Time Auction Platform

**LiveBid** is a high-performance, real-time auction system designed for scale and transactional safety. It ensures fair bidding through strict concurrency controls and provides instant feedback via WebSockets.

## Key Features

- **Real-Time Bidding**: Instant updates for all participants via WebSocket.
- **Image Uploads**: Direct browser-to-S3 uploads with pre-signed URLs.
- **Google OAuth**: Sign in with Google for seamless authentication.
- **Notifications**: Real-time alerts for outbid, auction won, and sale complete events.
- **Search & Filters**: Search auctions by title/description with status filters.
- **Financial Safety**: Escrow system that reserves funds upon bidding and refunds outbid users instantly.
- **Automated Settlement**: Auctions close automatically with funds transferred to sellers.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2 |
| **Frontend** | Next.js 14, TypeScript, TailwindCSS |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Storage** | AWS S3 |
| **Real-time** | WebSocket (STOMP/SockJS) |
| **Auth** | JWT, Google OAuth |

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Java 21
- Node.js 18+
- AWS Account (for S3)

### 2. Environment Setup
Create a `.env` file in the project root:
```bash
# Database (optional, uses defaults)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/livebid

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-2
S3_BUCKET_NAME=your-bucket-name

# Auth
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Launch Infrastructure
```bash
docker-compose up -d
```

### 4. Run Backend
```bash
export $(cat .env | xargs) && ./mvnw spring-boot:run
```
Server starts at `http://localhost:8080`

### 5. Run Frontend
```bash
cd livebid-ui
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/google` | Authenticate with Google |
| POST | `/auctions` | Create auction (with optional imageKey) |
| POST | `/auctions/{id}/start` | Activate auction |
| POST | `/auctions/{id}/bids` | Place a bid |
| GET | `/auctions?search=&status=` | Search auctions |
| POST | `/images/upload-url` | Get pre-signed S3 upload URL |
| GET | `/users/{id}/notifications` | Get user notifications |

## Project Structure

```
LiveBid/
├── src/main/java/com/livebid/
│   ├── auction/          # Auction, Bid, Settlement logic
│   ├── user/             # User management
│   ├── notification/     # Notification system
│   ├── image/            # S3 image upload service
│   └── infrastructure/   # Security, Config, WebSocket
├── livebid-ui/           # Next.js frontend
└── docker-compose.yml    # Postgres, Redis
```

---
