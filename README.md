# LiveBid - Real-Time Auction Platform

## Project Overview
This repository contains the backend for the LiveBid auction system.
It is built with **Java 21**, **Spring Boot 3**, **PostgreSQL**, and **Redis**.

## Getting Started

### 1. Infrastructure
Start the required services (Postgres, Redis, MinIO):
```bash
docker-compose up -d
```

### 2. Application Structure
We use a **Modular Monolith** package structure to keep features isolated.

```
src/main/java/com/livebid
├── api                 # Shared API (Exceptions, DTO Wrappers)
├── auction             # Auction Module
│   ├── controller      # REST API Endpoints
│   ├── model           # Entities (Auction, Bid)
│   └── service         # Business Logic (Bidding, locking)
├── user                # User Module
│   ├── controller      # User Management API
│   ├── model           # Entities (User)
│   └── service         # Balance & Auth Logic
├── infrastructure      # Cross-cutting concerns (Redis config, WebSocket config)
└── LiveBidApplication.java
```

## Phase 1 Instructions: Foundation
Your goal is to implement the Core Data Model and Basic CRUD.
1.  Review the `User` and `Auction` entities.
2.  Implement `UserService.createUser` (with toy balance).
3.  Implement `AuctionService.createAuction` (Draft state).
4.  Verify via proper Integration Tests or `curl`.

## Verification Tools (CLI)
We include a Python CLI for testing complex flows like "Bidding Wars".

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the interactive tool:
   ```bash
   python cli.py
   ```

## Development Rules
*   **Correctness First**: Ensure DB transactions are respected.
*   **No Placeholders**: Use `long` for money (cents), not `double`.
*   **Layer Separation**: Controllers -> Services -> Repositories.
