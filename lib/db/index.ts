import { SqliteRepository } from "@/lib/db/repository"

declare global {
  // eslint-disable-next-line no-var
  var __sqliteRepo: SqliteRepository | undefined
  // eslint-disable-next-line no-var
  var __sqliteRepoInitPromise: Promise<void> | undefined
}

export function getSqliteRepository(): SqliteRepository {
  if (!globalThis.__sqliteRepo) {
    globalThis.__sqliteRepo = new SqliteRepository()
  }
  return globalThis.__sqliteRepo
}

export async function ensureSqliteInitialized(): Promise<SqliteRepository> {
  const repo = getSqliteRepository()
  if (!globalThis.__sqliteRepoInitPromise) {
    globalThis.__sqliteRepoInitPromise = repo.initSchema()
  }
  await globalThis.__sqliteRepoInitPromise
  return repo
}

