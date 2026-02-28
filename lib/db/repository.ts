import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

export type SavePolicy = "manual_only" | "auto_interval" | "on_level_complete" | "on_exit"

export interface UserSettings {
  userId: string
  savePolicy: SavePolicy
  autoSaveSeconds: number
  saveChatHistory: boolean
  saveSimulatorState: boolean
}

export interface SimulatorSnapshotRecord {
  id: string
  userId: string
  trigger: "manual" | "auto_interval" | "level_complete" | "exit"
  levelId?: number
  name?: string
  paramsJson: string
  createdAt?: string
}

export interface TheoryChatMessageRecord {
  id: string
  threadId: string
  role: "user" | "assistant" | "system"
  contentMarkdown: string
  attachmentsJson?: string
}

type Row = Record<string, unknown>

type Statement = {
  run: (...params: unknown[]) => { changes: number; lastInsertRowid: number | bigint }
  get: (...params: unknown[]) => Row | undefined
  all: (...params: unknown[]) => Row[]
}

type BetterSqliteDatabase = {
  pragma: (sql: string) => void
  exec: (sql: string) => void
  prepare: (sql: string) => Statement
}

function loadBetterSqlite3Ctor(): new (filename: string) => BetterSqliteDatabase {
  try {
    const req = createRequire(import.meta.url)
    const mod = req("better-sqlite3") as { default?: unknown } | unknown
    const ctor = (mod as { default?: unknown })?.default ?? mod
    return ctor as new (filename: string) => BetterSqliteDatabase
  } catch (err) {
    const detail = err instanceof Error ? ` (${err.message})` : ""
    throw new Error(
      `SQLite driver missing or failed to load. Install with: npm i better-sqlite3${detail}`
    )
  }
}

function toBool(v: unknown): boolean {
  return Number(v) === 1
}

function resolveDbPath(): string {
  const configured = process.env.SQLITE_DB_PATH
  if (configured) return path.resolve(configured)
  return path.resolve(process.cwd(), "db", "app.sqlite")
}

export class SqliteRepository {
  private db: BetterSqliteDatabase

  constructor(dbFilePath = resolveDbPath()) {
    const Database = loadBetterSqlite3Ctor()
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true })
    this.db = new Database(dbFilePath)
    this.db.pragma("foreign_keys = ON")
  }

  async initSchema(): Promise<void> {
    const schemaPath = path.resolve(process.cwd(), "db", "schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")
    this.db.exec(schema)
  }

  async upsertUser(args: {
    id: string
    email: string
    name: string
    authProvider: "local" | "auth0"
    providerSubject?: string
  }): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO users (id, email, name, auth_provider, provider_subject, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           email=excluded.email,
           name=excluded.name,
           auth_provider=excluded.auth_provider,
           provider_subject=excluded.provider_subject,
           updated_at=datetime('now')`
      )
      .run(args.id, args.email, args.name, args.authProvider, args.providerSubject ?? null)

    // Ensure settings row exists
    this.db
      .prepare(
        `INSERT INTO user_settings (user_id, save_policy, auto_save_seconds, save_chat_history, save_simulator_state, updated_at)
         VALUES (?, 'manual_only', 0, 1, 1, datetime('now'))
         ON CONFLICT(user_id) DO NOTHING`
      )
      .run(args.id)
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const row = this.db
      .prepare(
        `SELECT user_id, save_policy, auto_save_seconds, save_chat_history, save_simulator_state
         FROM user_settings WHERE user_id = ?`
      )
      .get(userId)

    if (!row) return null
    return {
      userId: String(row.user_id),
      savePolicy: String(row.save_policy) as SavePolicy,
      autoSaveSeconds: Number(row.auto_save_seconds),
      saveChatHistory: toBool(row.save_chat_history),
      saveSimulatorState: toBool(row.save_simulator_state),
    }
  }

  async upsertUserSettings(settings: UserSettings): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO user_settings (user_id, save_policy, auto_save_seconds, save_chat_history, save_simulator_state, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           save_policy=excluded.save_policy,
           auto_save_seconds=excluded.auto_save_seconds,
           save_chat_history=excluded.save_chat_history,
           save_simulator_state=excluded.save_simulator_state,
           updated_at=datetime('now')`
      )
      .run(
        settings.userId,
        settings.savePolicy,
        settings.autoSaveSeconds,
        settings.saveChatHistory ? 1 : 0,
        settings.saveSimulatorState ? 1 : 0
      )
  }

  async markLevelCompleted(userId: string, track: "practical" | "theory", levelId: number): Promise<void> {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO learning_progress (id, user_id, track, level_id, completed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      )
      .run(crypto.randomUUID(), userId, track, levelId)
  }

  async listCompletedLevels(userId: string, track: "practical" | "theory"): Promise<number[]> {
    const rows = this.db
      .prepare(
        `SELECT level_id FROM learning_progress
         WHERE user_id = ? AND track = ?
         ORDER BY level_id ASC`
      )
      .all(userId, track)

    return rows.map((row) => Number(row.level_id))
  }

  async createSimulatorSnapshot(snapshot: SimulatorSnapshotRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO simulator_snapshots (id, user_id, name, trigger, level_id, params_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`
      )
      .run(
        snapshot.id || crypto.randomUUID(),
        snapshot.userId,
        snapshot.name ?? null,
        snapshot.trigger,
        snapshot.levelId ?? null,
        snapshot.paramsJson,
        snapshot.createdAt ?? null
      )
  }

  async listRecentSimulatorSnapshots(userId: string, limit = 20): Promise<SimulatorSnapshotRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT id, user_id, trigger, level_id, name, params_json, created_at
         FROM simulator_snapshots
         WHERE user_id = ?
         ORDER BY datetime(created_at) DESC
         LIMIT ?`
      )
      .all(userId, limit)

    return rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      trigger: String(row.trigger) as SimulatorSnapshotRecord["trigger"],
      levelId: row.level_id === null ? undefined : Number(row.level_id),
      name: row.name === null ? undefined : String(row.name),
      paramsJson: String(row.params_json),
      createdAt: String(row.created_at),
    }))
  }

  async appendTheoryChatMessage(message: TheoryChatMessageRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO theory_chat_messages (id, thread_id, role, content_markdown, attachments_json, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        message.id || crypto.randomUUID(),
        message.threadId,
        message.role,
        message.contentMarkdown,
        message.attachmentsJson ?? null
      )
  }
}
