/**
 * SQLite repository skeleton.
 *
 * Suggested implementation:
 * 1) Add a SQLite driver (e.g., better-sqlite3)
 * 2) Open DB at startup
 * 3) Run db/schema.sql
 * 4) Replace TODO throws below with concrete queries
 */

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

export class SqliteRepository {
  // private db: Database
  // constructor(dbFilePath: string) { ... }

  async initSchema(): Promise<void> {
    // TODO: execute db/schema.sql
    throw new Error("TODO: initSchema not implemented")
  }

  async upsertUser(args: {
    id: string
    email: string
    name: string
    authProvider: "local" | "auth0"
    providerSubject?: string
  }): Promise<void> {
    void args
    // TODO: insert/update users row
    throw new Error("TODO: upsertUser not implemented")
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    void userId
    // TODO: select from user_settings
    throw new Error("TODO: getUserSettings not implemented")
  }

  async upsertUserSettings(settings: UserSettings): Promise<void> {
    void settings
    // TODO: insert/update user_settings
    throw new Error("TODO: upsertUserSettings not implemented")
  }

  async markLevelCompleted(userId: string, track: "practical" | "theory", levelId: number): Promise<void> {
    void userId
    void track
    void levelId
    // TODO: insert ignore into learning_progress
    throw new Error("TODO: markLevelCompleted not implemented")
  }

  async listCompletedLevels(userId: string, track: "practical" | "theory"): Promise<number[]> {
    void userId
    void track
    // TODO: select level_id
    throw new Error("TODO: listCompletedLevels not implemented")
  }

  async createSimulatorSnapshot(snapshot: SimulatorSnapshotRecord): Promise<void> {
    void snapshot
    // TODO: insert simulator_snapshots
    throw new Error("TODO: createSimulatorSnapshot not implemented")
  }

  async listRecentSimulatorSnapshots(userId: string, limit = 20): Promise<SimulatorSnapshotRecord[]> {
    void userId
    void limit
    // TODO: select snapshots ordered by created_at desc
    throw new Error("TODO: listRecentSimulatorSnapshots not implemented")
  }

  async appendTheoryChatMessage(message: TheoryChatMessageRecord): Promise<void> {
    void message
    // TODO: insert theory_chat_messages
    throw new Error("TODO: appendTheoryChatMessage not implemented")
  }
}

