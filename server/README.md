# ML Maker Studio — Server

Express + PostgreSQL backend for authentication and project persistence.

## Setup

```bash
cd server
cp .env.example .env   # fill in your DB credentials and a JWT secret
npm install
npm run dev             # http://localhost:5000
```

Tables (`users`, `projects`) are created automatically on first run.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |

## API

All endpoints are prefixed with `/api`. Project routes require a `Bearer` token.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |

### Projects (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects (metadata only) |
| GET | `/api/projects/:id` | Get project with full canvas data |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects/:id` | Update name and/or canvas data |
| DELETE | `/api/projects/:id` | Delete a project |

### Health

`GET /api/health` — returns `{ "status": "ok" }`.

## Structure

```
server/
  index.js            Entry point
  db.js               PostgreSQL pool + table init
  middleware/
    auth.js           JWT verification middleware
  routes/
    auth.js           Register and login endpoints
    projects.js       CRUD for user projects
```

## Dependencies

| Package | Purpose |
|---------|---------|
| express | HTTP framework |
| pg | PostgreSQL client |
| bcrypt | Password hashing |
| jsonwebtoken | JWT auth tokens |
| cors | Cross-origin requests |
| dotenv | Environment variable loading |