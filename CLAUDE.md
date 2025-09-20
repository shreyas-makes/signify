# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Project Status

⚠️ **Project is in planning phase** - No code has been implemented yet. The project structure and commands below represent the planned architecture.

## Development Commands

Once the project is initialized, these commands will be used:

```bash
# Project setup
bun install                    # Install dependencies
bun run dev                    # Start development server (frontend + backend)
bun run build                  # Build for production
bun run start                  # Start production server

# Backend development
bun run backend:dev            # Start Hono backend only
bun run backend:build          # Build backend
bun run db:migrate             # Run database migrations
bun run db:seed                # Seed database with test data

# Frontend development  
bun run frontend:dev           # Start Vite dev server only
bun run frontend:build         # Build frontend
bun run frontend:preview       # Preview built frontend

# Testing
bun test                       # Run all tests
bun test:watch                 # Run tests in watch mode
bun test:backend               # Run backend tests only
bun test:frontend              # Run frontend tests only

# Code quality
bun run lint                   # Run ESLint
bun run type-check             # Run TypeScript checks
bun run format                 # Format code with Prettier
```

## Implementation Guide

The project follows a 13-step implementation plan located in `implementation-steps/`. Start with Step 1 (Project Foundation & Database Setup) and follow sequentially. Each step has detailed requirements and technical specifications.

### Key Planning Documents
- `prd.md` - Product Requirements Document with MVP features
- `user-journey.md` - Detailed user experience flows
- `implementation-steps/todo.md` - Complete implementation checklist
- `implementation-steps/1.md` through `implementation-steps/13.md` - Step-by-step implementation guide

### Database Requirements
- **Development**: PostgreSQL with node-postgres (pg) driver
- **Production**: PostgreSQL with connection pooling
- **Ports**: Backend on 3001, Frontend on 5173
- **Schema**: Raw SQL approach, no ORM

## Project Overview

Signify is a web application that proves content is 100% human-written by capturing every keystroke. The application consists of a writing editor that prevents copy/paste and records all typing, then publishes content to permanent shareable links showing the complete keystroke timeline for verification.

## Technology Stack & Project Structure

- **Runtime**: Bun (JavaScript runtime)
- **Backend**: Hono (lightweight web framework)
- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT-based

### Expected Directory Structure
```
signify/
├── backend/                   # Hono API server
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Authentication, CORS, etc.
│   │   └── index.ts          # Server entry point
│   └── drizzle/              # Database migrations
├── frontend/                 # Vite + React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks (keystroke capture)
│   │   ├── pages/            # Route components
│   │   ├── lib/              # Utilities, API client
│   │   └── main.tsx          # App entry point
│   └── public/
└── shared/                   # Shared TypeScript types
```

## Architecture Principles

### Core Data Flow
1. **Keystroke Capture**: React editor captures every keystroke with timestamp
2. **Data Storage**: Raw keystroke data stored on backend
3. **Publishing**: Generate permanent link with keystroke timeline
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