# Signify

Keystroke verification platform for proving human authorship of content.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- PostgreSQL >= 12

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb signify_dev
   
   # Copy environment file
   cp .env.example .env
   
   # Update DATABASE_URL in .env if needed
   ```

3. **Run database migrations:**
   ```bash
   bun run db:migrate
   ```

4. **Start development servers:**
   ```bash
   bun run dev
   ```

   This starts:
   - Backend API server on http://localhost:3001
   - Frontend React app on http://localhost:5173

## Project Structure

```
signify/
├── backend/          # Hono API server (TypeScript)
├── frontend/         # Vite + React app (TypeScript)
├── shared/           # Shared TypeScript types
└── implementation-steps/  # Development roadmap
```

## Development Commands

```bash
# Development
bun run dev                    # Start both frontend and backend
bun run backend:dev            # Backend only
bun run frontend:dev           # Frontend only

# Database
bun run db:migrate             # Run migrations
bun run db:seed               # Seed with test data

# Building
bun run build                 # Build both projects
bun run backend:build         # Backend only
bun run frontend:build        # Frontend only

# Testing
bun test                      # Run all tests
bun run lint                  # Lint code
bun run type-check            # TypeScript checks
```

## Database Setup

The project uses PostgreSQL. Make sure you have it installed and running:

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
createdb signify_dev
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb signify_dev
```

**Docker:**
```bash
docker run --name signify-postgres -e POSTGRES_DB=signify_dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/signify_dev
PORT=3001
JWT_SECRET=your-secret-key
```

## Implementation Status

✅ **Step 1: Project Foundation & Database Setup** (Current)
- [x] Bun + Hono + Vite + React monorepo
- [x] PostgreSQL database schema
- [x] Basic API health check
- [x] Development environment

🔄 **Next Steps:**
- Step 2: Authentication System
- Step 3: Keystroke Capture System
- Step 4: Editor Component

See `implementation-steps/` for detailed roadmap.

## Technology Stack

- **Runtime:** Bun
- **Backend:** Hono (lightweight web framework)
- **Frontend:** Vite + React + TypeScript
- **Database:** PostgreSQL
- **Styling:** Tailwind CSS
- **Authentication:** JWT