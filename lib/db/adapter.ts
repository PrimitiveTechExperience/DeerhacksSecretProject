import { SqliteRepository } from './repository';
import { TursoRepository } from './turso-repository';

let repositoryInstance: SqliteRepository | TursoRepository | null = null;

export function getRepository(): SqliteRepository | TursoRepository {
	if (!repositoryInstance) {
		const tursoUrl = process.env.TURSO_DATABASE_URL;
		const tursoToken = process.env.TURSO_AUTH_TOKEN;
		const isVercel = process.env.VERCEL === '1';

		if (tursoUrl && tursoToken) {
			console.log('[DB] Using Turso database');
			repositoryInstance = new TursoRepository();
		} else if (isVercel) {
			// On Vercel we require Turso to be configured so that
			// user progress and other data can be persisted reliably.
			throw new Error(
				'[DB] Running on Vercel without Turso credentials. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your Vercel environment.',
			);
		} else {
			console.log('[DB] Using local SQLite database');
			repositoryInstance = new SqliteRepository();
		}
	}

	return repositoryInstance;
}
