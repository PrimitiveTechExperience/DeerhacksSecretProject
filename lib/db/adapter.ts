import { SqliteRepository } from './repository';
import { TursoRepository } from './turso-repository';

// In-memory fallback for when database file is not writable (e.g., Vercel)
class NoOpRepository extends SqliteRepository {
	constructor() {
		super(':memory:'); // Use in-memory database
	}

	async upsertUser(): Promise<void> {
		// No-op in production without proper database
	}

	async markLevelCompleted(): Promise<void> {
		// No-op
	}

	async saveSimulatorSnapshot(): Promise<void> {
		// No-op
	}

	async saveTheoryChatMessage(): Promise<void> {
		// No-op
	}
}

let repositoryInstance: SqliteRepository | TursoRepository | null = null;

export function getRepository(): SqliteRepository | TursoRepository {
	if (!repositoryInstance) {
		const tursoUrl = process.env.TURSO_DATABASE_URL;
		const tursoToken = process.env.TURSO_AUTH_TOKEN;
		const isVercel = process.env.VERCEL === '1';

		if (tursoUrl && tursoToken) {
			console.log('[DB] Using Turso database');
			repositoryInstance = new TursoRepository();
			void repositoryInstance.initSchema().catch(console.error);
		} else if (isVercel) {
			console.warn(
				'[DB] Running on Vercel without Turso credentials - database writes disabled.',
			);
			repositoryInstance = new NoOpRepository();
		} else {
			console.log('[DB] Using local SQLite database');
			repositoryInstance = new SqliteRepository();
			void repositoryInstance.initSchema().catch(console.error);
		}
	}

	return repositoryInstance;
}
