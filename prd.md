# Product Requirements Document: Signify MVP

## Overview
Signify is a web application built with Bun + Hono + Vite + React that proves content is 100% human-written by capturing every keystroke. Writers create content in a custom React editor that prevents copy/paste and records all typing, then publish to permanent shareable links showing the complete keystroke timeline.

## Core Value Proposition
- **For Writers**: Prove your content is 100% human-written through complete keystroke transparency
- **For Readers**: Verify authenticity by seeing every keystroke with timestamps

## MVP Features

### 1. User Authentication
- **Simple email/password authentication** with JWT
- **One device per account** - no cross-device complexity
- **User profiles** with basic information storage

### 2. Writing Editor
- **Custom React editor** with keystroke capture
- **Complete paste prevention** - all content must be human-typed
- **Auto-save every 30 seconds** with keystroke data
- **Clean, distraction-free interface**

### 3. Keystroke Recording
**Captured Data:**
- Every keystroke with precise timestamp
- Character typed (including backspaces, spaces)
- Typing sequence and timing
- Complete edit history

**Storage:**
- Raw keystroke data stored on backend
- Publicly accessible for verification

### 4. Human Verification
- **Manual typing verification** - no copy/paste = human authorship
- **Complete keystroke transparency** for public verification
- **Immutable after publication** - prevents tampering

### 5. Publishing
- **One-click publish** from editor
- **Permanent URLs** (`signify.app/posts/abc123`)
- **No editing after publish**
- **Keystroke timeline** displayed on published posts

### 6. Reader View
- **Keystroke timeline** showing typing progression
- **Timestamp markers** for each keystroke
- **Character-by-character replay** capability
- **Raw keystroke data access** for verification
- **Visual proof** of manual typing without copy/paste

## Technical Stack

### Backend (Bun + Hono)
```typescript
POST /auth/register - User registration
POST /auth/login - JWT authentication  
POST /posts/draft - Save draft with keystroke data
POST /posts/publish - Publish with keystroke timeline
GET /posts/:slug - Serve published content
GET /posts/:slug/keystrokes - Raw keystroke data with timestamps
```

### Frontend (Vite + React)
```typescript
<Editor> - Text editor with keystroke capture
<KeystrokeTimeline> - Visual keystroke progression
<PublishedPost> - Reader view with keystroke display
<AuthProvider> - JWT authentication
<KeystrokeReplay> - Character-by-character playback
```

### Database
```sql
users (id, email, password_hash, display_name)
posts (id, user_id, title, content, slug, published_at, word_count)
keystroke_events (id, post_id, timestamp, character, event_type)
```

## User Flow

### Writer
1. Register → Create account with email/password
2. Write → Every keystroke captured in React editor
3. Auto-save → Every 30 seconds to Hono API
4. Publish → Generate keystroke timeline + permanent link
5. Share → Send link to readers

### Reader
1. Click shared link
2. See keystroke timeline immediately
3. Read content with verification
4. Explore raw keystroke data for proof

## Success Metrics
- Writers can publish manually-typed content
- Readers can verify every keystroke was manually typed
- Zero copy/paste content gets through
- Clean writing experience with no typing lag
- Simple sharing via permanent links with keystroke proof

## Technology Details
- **Bun** - JavaScript runtime
- **Hono** - Web framework for API
- **Vite** - Build tool and dev server
- **React** - Frontend framework
- **JWT** - Authentication
- **SQLite** - Database storage
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

This MVP provides a simple, transparent solution for proving human authorship through complete keystroke visibility.