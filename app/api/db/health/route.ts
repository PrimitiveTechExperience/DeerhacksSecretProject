import { NextResponse } from 'next/server';
import { ensureSqliteInitialized } from '@/lib/db';
import { SqliteRepository } from '@/lib/db/repository';
import { TursoRepository } from '@/lib/db/turso-repository';

export async function GET() {
	try {
		const repo = await ensureSqliteInitialized();

		const dbKind =
			repo instanceof TursoRepository
				? 'turso'
				: repo instanceof SqliteRepository
					? 'sqlite'
					: 'unknown';

		return NextResponse.json({ ok: true, db: dbKind, initialized: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown_error';
		return NextResponse.json(
			{ ok: false, initialized: false, error: message },
			{ status: 500 },
		);
	}
}
