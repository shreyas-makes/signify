-- Signify Database Schema
-- PostgreSQL tables for keystroke verification platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Keystroke events table
CREATE TABLE IF NOT EXISTS keystroke_events (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    character VARCHAR(10),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('keydown', 'keyup', 'input', 'delete')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drafts table for auto-save functionality
CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Draft keystroke events table
CREATE TABLE IF NOT EXISTS draft_keystroke_events (
    id SERIAL PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    character VARCHAR(10),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('keydown', 'keyup', 'input', 'delete')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_post_id ON keystroke_events(post_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_timestamp ON keystroke_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_last_saved_at ON drafts(last_saved_at);
CREATE INDEX IF NOT EXISTS idx_draft_keystroke_events_draft_id ON draft_keystroke_events(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_keystroke_events_timestamp ON draft_keystroke_events(timestamp);