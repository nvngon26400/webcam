# AuraMeet — Database Schema & Row Level Security (RLS)

AuraMeet uses **Supabase PostgreSQL** as its primary relational store. Ephemeral state (typing indicators, active volume meters) is delegated to Redis Pub/Sub, keeping the database optimized for persistent records.

## 1. Relational Entity Schema

```sql
-- Enable cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Multi-Tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    plan_tier VARCHAR(50) DEFAULT 'PRO',
    max_room_capacity INT DEFAULT 300,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users & Profiles
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    system_role VARCHAR(50) DEFAULT 'PARTICIPANT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Meetings
CREATE TABLE meetings (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'aur-839-214'
    organization_id UUID REFERENCES organizations(id),
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'SCHEDULED', -- SCHEDULED, WAITING, LIVE, ENDING, ENDED
    passcode_hash VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    waiting_room_enabled BOOLEAN DEFAULT TRUE,
    allow_screen_share BOOLEAN DEFAULT TRUE,
    allow_chat BOOLEAN DEFAULT TRUE,
    mute_on_entry BOOLEAN DEFAULT FALSE,
    e2ee_enabled BOOLEAN DEFAULT TRUE,
    max_participants INT DEFAULT 100,
    scheduled_start TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Meeting Participants (Session Audit)
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL,
    meeting_role VARCHAR(32) DEFAULT 'PARTICIPANT', -- HOST, CO_HOST, PARTICIPANT, GUEST
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    in_waiting_room BOOLEAN DEFAULT FALSE,
    connection_quality VARCHAR(32) DEFAULT 'excellent'
);

-- 5. In-Meeting Persistent Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = Public broadcast
    message_text TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Breakout Rooms
CREATE TABLE breakout_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Cloud Recordings
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
    duration_seconds INT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Meeting Intelligence Summaries
CREATE TABLE ai_meeting_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    key_decisions JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    key_topics JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Security Audit Logs (Append-Only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(64) NOT NULL,
    category VARCHAR(32) NOT NULL,
    details TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Row Level Security (RLS) Policies

```sql
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Meeting Access Policy
CREATE POLICY "Meeting isolation" ON meetings
FOR SELECT USING (
  organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
);

-- Private Chat Isolation Policy
CREATE POLICY "Chat message isolation" ON chat_messages
FOR SELECT USING (
  recipient_id IS NULL 
  OR recipient_id = auth.uid() 
  OR sender_id = auth.uid()
);
```
