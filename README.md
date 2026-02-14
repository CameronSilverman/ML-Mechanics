# ML Maker Studio

A visual drag-and-drop environment for building machine learning pipelines — no code required.

## Project Structure

```
client/     React frontend — workspace canvas, component sidebar, property editors
server/     Express backend — authentication, project persistence
```

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14

## Setup

### 1. Database

Create a PostgreSQL database:

```bash
createdb ml_maker_studio
```

### 2. Server

```bash
cd server
cp .env.example .env       # then edit .env with your DB credentials and a JWT secret
npm install
npm run dev                 # starts on http://localhost:5000
```

Tables are created automatically on first run.

### 3. Client

```bash
cd client
npm install
npm start                   # starts on http://localhost:3000
```

## API

All endpoints are prefixed with `/api`. Project routes require a `Bearer` token in the `Authorization` header.

| Method | Endpoint              | Auth | Description            |
|--------|-----------------------|------|------------------------|
| POST   | `/api/auth/register`  | No   | Create account         |
| POST   | `/api/auth/login`     | No   | Sign in                |
| GET    | `/api/projects`       | Yes  | List user's projects   |
| GET    | `/api/projects/:id`   | Yes  | Get a project          |
| POST   | `/api/projects`       | Yes  | Create a project       |
| PUT    | `/api/projects/:id`   | Yes  | Update a project       |
| DELETE | `/api/projects/:id`   | Yes  | Delete a project       |
| GET    | `/api/health`         | No   | Server health check    |

### Auth request/response shapes

**Register / Login** — `POST /api/auth/register` or `/api/auth/login`

```json
// Request
{ "email": "user@example.com", "password": "secret123" }

// Response (201 for register, 200 for login)
{
  "token": "eyJhbG...",
  "user": { "id": 1, "email": "user@example.com", "createdAt": "..." }
}
```

### Project request/response shapes

**Create** — `POST /api/projects`

```json
// Request
{ "name": "My CNN", "data": { "blocks": [...], "connections": [...] } }
```

**Update** — `PUT /api/projects/:id`

```json
// Request (both fields optional)
{ "name": "Renamed", "data": { "blocks": [...] } }
```
