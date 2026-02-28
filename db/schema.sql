PRAGMA foreign_keys = ON;

-- Core user identity table (works for local + Auth0 providers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                       -- app user id (uuid or stable provider composite)
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  auth_provider TEXT NOT NULL,              -- local | auth0
  provider_subject TEXT,                    -- Auth0 sub later
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_provider_subject
  ON users(auth_provider, provider_subject);

-- Optional server-side session tracking (if you move away from cookie-only local sessions)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token_hash TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);

-- Per-user configuration for save behavior
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  save_policy TEXT NOT NULL DEFAULT 'manual_only',     -- manual_only | auto_interval | on_level_complete | on_exit
  auto_save_seconds INTEGER NOT NULL DEFAULT 0,        -- >0 only when policy uses interval
  save_chat_history INTEGER NOT NULL DEFAULT 1,        -- 0/1
  save_simulator_state INTEGER NOT NULL DEFAULT 1,     -- 0/1
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Learning roadmap completion (practical + theory)
CREATE TABLE IF NOT EXISTS learning_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  track TEXT NOT NULL,                                  -- practical | theory
  level_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, track, level_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_track
  ON learning_progress(user_id, track);

-- Saved simulator state snapshots
CREATE TABLE IF NOT EXISTS simulator_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,                                            -- optional user-given label
  trigger TEXT NOT NULL,                                -- manual | auto_interval | level_complete | exit
  level_id INTEGER,
  params_json TEXT NOT NULL,                            -- serialized RobotParams + context
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sim_snapshots_user_created
  ON simulator_snapshots(user_id, created_at DESC);

-- Theory chat threads and messages
CREATE TABLE IF NOT EXISTS theory_chat_threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  theory_level_id INTEGER NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_theory_threads_user_level
  ON theory_chat_threads(user_id, theory_level_id);

CREATE TABLE IF NOT EXISTS theory_chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL,                                   -- user | assistant | system
  content_markdown TEXT NOT NULL,
  attachments_json TEXT,                                -- uploaded files metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES theory_chat_threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_theory_messages_thread_created
  ON theory_chat_messages(thread_id, created_at);

