# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Philosophy

### Core Beliefs

- **Incremental progress over big bangs** - Small changes that compile and pass tests
- **Learning from existing code** - Study and plan before implementing
- **Pragmatic over dogmatic** - Adapt to project reality
- **Clear intent over clever code** - Be boring and obvious

### Simplicity Means

- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex

## Development Commands

Once PostgreSQL is set up (`createdb signify_dev`), these commands are available:

```bash
# Initial setup
bun install                    # Install all workspace dependencies
cp .env.example .env          # Set up environment variables
bun run db:migrate            # Initialize database schema

# Development
bun run dev                   # Start both backend (3001) and frontend (5173)
bun run backend:dev           # Backend only with hot reload
bun run frontend:dev          # Frontend only with hot reload

# Database operations
bun run db:migrate            # Run database schema migrations
bun run db:seed              # Seed database with test data

# Testing and quality
bun test                     # Run all tests (backend + frontend)
bun run test:backend         # Backend tests only  
bun run test:frontend        # Frontend tests only
bun run test:watch           # Run tests in watch mode
bun run lint                 # Lint all code
bun run type-check           # TypeScript type checking
bun run format               # Format code with Prettier

# Building
bun run build                # Build both projects for production
bun run backend:build        # Build backend only
bun run frontend:build       # Build frontend only
```

## Architecture Overview

This is a Bun monorepo with a Hono backend and Vite+React frontend. The core architecture revolves around capturing and verifying keystroke data to prove human authorship.

### Monorepo Structure
- **Root**: Workspace orchestration with concurrently running backend/frontend
- **Backend**: Hono API server with PostgreSQL connection pooling
- **Frontend**: Vite+React+TypeScript with Tailwind CSS
- **Shared**: TypeScript interfaces used by both backend and frontend

### Database Architecture
- **Connection**: PostgreSQL with node-postgres (pg) driver and connection pooling (max 20 connections)
- **Schema**: Raw SQL in `backend/src/db/schema.sql` - no ORM used
- **Initialization**: Server startup automatically runs schema migrations via `initializeDatabase()`
- **Tables**: users, posts, keystroke_events with proper foreign key relationships

### Backend Architecture (Hono)
- **Entry point**: `backend/src/index.ts` sets up Hono app with CORS, logging, error handling
- **Database**: `backend/src/db/index.ts` manages PostgreSQL pool and schema initialization
- **API design**: RESTful endpoints with consistent JSON responses, health check at `/health`
- **Error handling**: Global error handler with proper HTTP status codes

### Frontend Architecture (React)
- **Build tool**: Vite with TypeScript, hot reload, and API proxy (`/api/*` → `localhost:3001`)
- **Styling**: Tailwind CSS with custom configuration for monospace fonts and primary colors
- **Health monitoring**: App.tsx includes backend health check on load
- **Type safety**: Shared types from `@shared/types` ensure frontend-backend contract

### Type System
All interfaces are centralized in `shared/types.ts`:
- **Core entities**: User, Post, KeystrokeEvent with proper typing
- **API contracts**: Request/response types for all endpoints
- **Keystroke data**: Specialized types for capturing timing and event data

## Implementation Guide

The project follows a 13-step implementation plan located in `implementation-steps/`. Step 1 (Project Foundation) is complete. Continue with Step 2 (Authentication System).

### Key Planning Documents
- `prd.md` - Product Requirements Document with MVP features
- `user-journey.md` - Detailed user experience flows
- `implementation-steps/todo.md` - Complete implementation checklist
- `implementation-steps/1.md` through `implementation-steps/13.md` - Step-by-step implementation guide

## Project Overview

Signify is a web application that proves content is 100% human-written by capturing every keystroke. The application consists of a writing editor that prevents copy/paste and records all typing, then publishes content to permanent shareable links showing the complete keystroke timeline for verification.

## Technology Stack & Project Structure

- **Runtime**: Bun (JavaScript runtime)
- **Backend**: Hono (lightweight web framework)
- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT-based

## Architecture Principles

### Core Data Flow
1. **Keystroke Capture**: React editor captures every keystroke with timestamp
2. **Data Storage**: Raw keystroke data stored on backend
3. **Publishing**: Generate permanent link for published blog with the ability to view keystroke timeline
4. **Immutable Publishing**: Content cannot be edited after publication
5. **Public Transparency**: Complete keystroke data publicly accessible for verification

### Key Constraints
- **Complete paste prevention**: All content must be human-typed (no copy/paste allowed)
- **One device per account**: No cross-device syncing to maintain keystroke integrity
- **Immutable content**: Published posts cannot be edited to preserve keystroke validity
- **Public keystroke data**: All keystrokes with timestamps are stored and made publicly viewable

## Database Schema

```sql
users (id, email, password_hash, display_name)
posts (id, user_id, title, content, slug, published_at, word_count)
keystroke_events (id, post_id, timestamp, character, event_type)
```

## API Endpoints Structure

```typescript
POST /auth/register - User registration
POST /auth/login - JWT authentication
POST /posts/draft - Save draft with keystroke data
POST /posts/publish - Publish with keystroke timeline
GET /posts/:slug - Serve published content with keystroke timeline
GET /posts/:slug/keystrokes - Raw keystroke data with timestamps
```

## Frontend Components Architecture

- **Editor Component**: Custom text editor with keystroke event capture
- **KeystrokeCapture Hook**: Real-time monitoring and recording of every keystroke
- **KeystrokeTimeline Component**: Visual timeline of typing progression
- **PublishedPost Component**: Reader view with keystroke timeline display
- **KeystrokeReplay Component**: Character-by-character playback of typing
- **AuthProvider**: JWT authentication context management

## Keystroke Recording Requirements

The system captures:
- **Every keystroke**: All characters, backspaces, spaces with precise timestamps
- **Event types**: Keydown, keyup, character input, deletions
- **Typing sequence**: Complete chronological order of all input
- **Timing data**: Exact timestamps for each keystroke event

## Human Verification Logic

- **Manual Typing Proof**: No copy/paste = human authorship
- **Complete Transparency**: All keystroke data with timestamps publicly viewable
- **Verification Method**: Readers can see every character was manually typed
- **Trust Through Visibility**: Raw keystroke timeline proves manual typing
- **Simple Rule**: If all content was typed keystroke-by-keystroke, it's human

## Keystroke Timeline Display

Published content includes a visual timeline showing:
- Complete keystroke progression with timestamp markers
- Character-by-character typing sequence
- Visual proof of manual typing without copy/paste
- Interactive replay capability for verification

## Critical Development Notes

- **Zero typing latency**: Keystroke capture must not impact writing experience (<1ms latency)
- **Complete transparency**: Raw keystroke data must be publicly accessible
- **Immutable publishing**: No post-publication editing to maintain keystroke integrity
- **Paste prevention**: Complete blocking of paste operations in editor (Ctrl+V, right-click, drag-drop)
- **Simple verification**: Manual typing = human authorship, no complex analysis needed
- **Performance**: 60fps animations, efficient event batching (100ms intervals)
- **Security**: One device per account, rate limiting (5 attempts/min), XSS protection
- **Auto-save**: Every 30 seconds with exponential backoff retry logic


### When Stuck (After 3 Attempts)

**CRITICAL**: Maximum 3 attempts per issue, then STOP.

1. **Document what failed**:
   - What you tried
   - Specific error messages
   - Why you think it failed

2. **Research alternatives**:
   - Find 2-3 similar implementations
   - Note different approaches used

3. **Question fundamentals**:
   - Is this the right abstraction level?
   - Can this be split into smaller problems?
   - Is there a simpler approach entirely?

4. **Try different angle**:
   - Different library/framework feature?
   - Different architectural pattern?
   - Remove abstraction instead of adding?


## Technical Standards

### Architecture Principles

- **Composition over inheritance** - Use dependency injection
- **Interfaces over singletons** - Enable testing and flexibility
- **Explicit over implicit** - Clear data flow and dependencies
- **Test-driven when possible** - Never disable tests, fix them

### Code Quality

- **Every commit must**:
  - Compile successfully
  - Pass all existing tests
  - Include tests for new functionality
  - Follow project formatting/linting

- **Before committing**:
  - Run formatters/linters
  - Self-review changes
  - Ensure commit message explains "why"

### Error Handling

- Fail fast with descriptive messages
- Include context for debugging
- Handle errors at appropriate level
- Never silently swallow exceptions

## Decision Framework

When multiple valid approaches exist, choose based on:

1. **Testability** - Can I easily test this?
2. **Readability** - Will someone understand this in 6 months?
3. **Consistency** - Does this match project patterns?
4. **Simplicity** - Is this the simplest solution that works?
5. **Reversibility** - How hard to change later?

## Project Integration

### Learning the Codebase

- Find 3 similar features/components
- Identify common patterns and conventions
- Use same libraries/utilities when possible
- Follow existing test patterns

### Tooling

- Use project's existing build system
- Use project's test framework
- Use project's formatter/linter settings
- Don't introduce new tools without strong justification

## Quality Gates

### Definition of Done

- [ ] Tests written and passing
- [ ] Code follows project conventions
- [ ] No linter/formatter warnings
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

### Test Guidelines

- Test behavior, not implementation
- One assertion per test when possible
- Clear test names describing scenario
- Use existing test utilities/helpers
- Tests should be deterministic
