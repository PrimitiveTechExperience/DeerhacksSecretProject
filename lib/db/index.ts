import { SqliteRepository } from '@/lib/db/repository';
import { TursoRepository } from '@/lib/db/turso-repository';
import { getRepository } from '@/lib/db/adapter';

type Repository = SqliteRepository | TursoRepository;

declare global {
	// eslint-disable-next-line no-var
	var __sqliteRepo: Repository | undefined;
	// eslint-disable-next-line no-var
	var __sqliteRepoInitPromise: Promise<void> | undefined;
}

export function getSqliteRepository(): Repository {
	if (!globalThis.__sqliteRepo) {
		globalThis.__sqliteRepo = getRepository();
	}
	return globalThis.__sqliteRepo;
}

export async function ensureSqliteInitialized(): Promise<Repository> {
	const repo = getSqliteRepository();
	if (!globalThis.__sqliteRepoInitPromise) {
		globalThis.__sqliteRepoInitPromise = repo.initSchema();
	}
	await globalThis.__sqliteRepoInitPromise;
	return repo;
}
