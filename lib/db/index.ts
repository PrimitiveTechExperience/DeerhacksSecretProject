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
		globalThis.__sqliteRepo = getRepository(); // Use adapter instead of direct instantiation
	}
	return globalThis.__sqliteRepo;
}

export async function ensureSqliteInitialized(): Promise<Repository> {
	const repo = getSqliteRepository();
	const hasTurso = !!(
		process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
	);
	const isVercel = process.env.VERCEL === '1';

	// Initialize schema for Turso or local SQLite (not for NoOp on Vercel without Turso)
	if ((hasTurso || !isVercel) && !globalThis.__sqliteRepoInitPromise) {
		globalThis.__sqliteRepoInitPromise = repo.initSchema();
	}
	if (hasTurso || !isVercel) {
		await globalThis.__sqliteRepoInitPromise;
	}
	return repo;
}
