import { createClient, type Client } from '@libsql/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class TursoRepository {
	private client: Client;

	constructor() {
		const url = process.env.TURSO_DATABASE_URL;
		const authToken = process.env.TURSO_AUTH_TOKEN;

		if (!url || !authToken) {
			throw new Error(
				'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required',
			);
		}

		this.client = createClient({
			url,
			authToken,
		});

		console.log('[DB] Connected to Turso database');
	}

	async initSchema(): Promise<void> {
		const schemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');
		const schema = fs.readFileSync(schemaPath, 'utf8');

		// Execute schema (split by semicolons for multiple statements)
		const statements = schema
			.split(';')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		for (const stmt of statements) {
			await this.client.execute(stmt);
		}

		// Backfill newly-added columns
		try {
			await this.client.execute(
				'SELECT preferred_theme FROM user_settings LIMIT 1',
			);
		} catch {
			await this.client.execute(
				"ALTER TABLE user_settings ADD COLUMN preferred_theme TEXT NOT NULL DEFAULT 'system'",
			);
		}

		console.log('[DB] Schema initialized');
	}

	async upsertUser(args: {
		id: string;
		email: string;
		name: string;
		authProvider: 'local' | 'auth0';
		providerSubject?: string;
	}): Promise<void> {
		await this.client.execute({
			sql: `INSERT INTO users (id, email, name, auth_provider, provider_subject, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           email=excluded.email,
           name=excluded.name,
           auth_provider=excluded.auth_provider,
           provider_subject=excluded.provider_subject,
           updated_at=datetime('now')`,
			args: [
				args.id,
				args.email,
				args.name,
				args.authProvider,
				args.providerSubject ?? null,
			],
		});

		// Ensure settings row exists
		await this.client.execute({
			sql: `INSERT INTO user_settings (user_id, save_policy, auto_save_seconds, save_chat_history, save_simulator_state, preferred_theme, updated_at)
         VALUES (?, 'manual_only', 0, 1, 1, 'system', datetime('now'))
         ON CONFLICT(user_id) DO NOTHING`,
			args: [args.id],
		});
	}

	async markLevelCompleted(
		userId: string,
		track: 'practical' | 'theory',
		levelId: number,
	): Promise<void> {
		await this.client.execute({
			sql: `INSERT INTO learning_progress (id, user_id, track, level_id, completed_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, track, level_id) DO NOTHING`,
			args: [crypto.randomUUID(), userId, track, levelId],
		});
	}

	async listCompletedLevels(
		userId: string,
		track: 'practical' | 'theory',
	): Promise<number[]> {
		const result = await this.client.execute({
			sql: 'SELECT level_id FROM learning_progress WHERE user_id = ? AND track = ? ORDER BY level_id ASC',
			args: [userId, track],
		});
		return result.rows.map((row) => Number(row.level_id));
	}

	async getCompletedLevels(userId: string): Promise<number[]> {
		// Legacy method - returns only practical levels for backwards compatibility
		return this.listCompletedLevels(userId, 'practical');
	}

	async saveSimulatorSnapshot(args: {
		id: string;
		userId: string;
		trigger: 'manual' | 'auto_interval' | 'level_complete' | 'exit';
		levelId?: number;
		name?: string;
		paramsJson: string;
	}): Promise<void> {
		await this.client.execute({
			sql: `INSERT INTO simulator_snapshots (id, user_id, trigger, level_id, name, params_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
			args: [
				args.id,
				args.userId,
				args.trigger,
				args.levelId ?? null,
				args.name ?? null,
				args.paramsJson,
			],
		});
	}

	async createSimulatorSnapshot(snapshot: {
		id?: string;
		userId: string;
		trigger: 'manual' | 'auto_interval' | 'level_complete' | 'exit';
		levelId?: number;
		name?: string;
		paramsJson: string;
	}): Promise<void> {
		await this.saveSimulatorSnapshot({
			id: snapshot.id || crypto.randomUUID(),
			userId: snapshot.userId,
			trigger: snapshot.trigger,
			levelId: snapshot.levelId,
			name: snapshot.name,
			paramsJson: snapshot.paramsJson,
		});
	}

	async listRecentSimulatorSnapshots(
		userId: string,
		limit = 20,
	): Promise<unknown[]> {
		return this.getSimulatorSnapshots(userId, limit);
	}

	async getSimulatorSnapshots(
		userId: string,
		limit = 50,
	): Promise<unknown[]> {
		const result = await this.client.execute({
			sql: `SELECT * FROM simulator_snapshots 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
			args: [userId, limit],
		});
		return result.rows;
	}

	async saveTheoryChatMessage(args: {
		id: string;
		threadId: string;
		role: 'user' | 'assistant' | 'system';
		content: string;
	}): Promise<void> {
		await this.client.execute({
			sql: `INSERT INTO theory_chat_messages (id, thread_id, role, content_markdown, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
			args: [args.id, args.threadId, args.role, args.content],
		});
	}

	async appendTheoryChatMessage(message: {
		id?: string;
		threadId: string;
		role: 'user' | 'assistant' | 'system';
		contentMarkdown: string;
		attachmentsJson?: string;
	}): Promise<void> {
		await this.client.execute({
			sql: `INSERT INTO theory_chat_messages (id, thread_id, role, content_markdown, attachments_json, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
			args: [
				message.id || crypto.randomUUID(),
				message.threadId,
				message.role,
				message.contentMarkdown,
				message.attachmentsJson ?? null,
			],
		});
	}

	async getTheoryChatMessages(threadId: string): Promise<unknown[]> {
		const result = await this.client.execute({
			sql: `SELECT * FROM theory_chat_messages 
         WHERE thread_id = ? 
         ORDER BY created_at ASC`,
			args: [threadId],
		});
		return result.rows;
	}

	async getUserSettings(userId: string): Promise<unknown | null> {
		const result = await this.client.execute({
			sql: 'SELECT * FROM user_settings WHERE user_id = ?',
			args: [userId],
		});
		return result.rows[0] ?? null;
	}

	async updateUserSettings(args: {
		userId: string;
		savePolicy?: string;
		autoSaveSeconds?: number;
		saveChatHistory?: boolean;
		saveSimulatorState?: boolean;
		theme?: string;
	}): Promise<void> {
		const updates: string[] = [];
		const values: (string | number)[] = [];

		if (args.savePolicy !== undefined) {
			updates.push('save_policy = ?');
			values.push(args.savePolicy);
		}
		if (args.autoSaveSeconds !== undefined) {
			updates.push('auto_save_seconds = ?');
			values.push(args.autoSaveSeconds);
		}
		if (args.saveChatHistory !== undefined) {
			updates.push('save_chat_history = ?');
			values.push(args.saveChatHistory ? 1 : 0);
		}
		if (args.saveSimulatorState !== undefined) {
			updates.push('save_simulator_state = ?');
			values.push(args.saveSimulatorState ? 1 : 0);
		}
		if (args.theme !== undefined) {
			updates.push('preferred_theme = ?');
			values.push(args.theme);
		}

		if (updates.length > 0) {
			updates.push("updated_at = datetime('now')");
			values.push(args.userId);

			await this.client.execute({
				sql: `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
				args: values,
			});
		}
	}

	async upsertUserSettings(settings: {
		userId: string;
		savePolicy: string;
		autoSaveSeconds: number;
		saveChatHistory: boolean;
		saveSimulatorState: boolean;
		theme: string;
	}): Promise<void> {
		await this.client.execute({
			sql: `INSERT INTO user_settings (user_id, save_policy, auto_save_seconds, save_chat_history, save_simulator_state, preferred_theme, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           save_policy=excluded.save_policy,
           auto_save_seconds=excluded.auto_save_seconds,
           save_chat_history=excluded.save_chat_history,
           save_simulator_state=excluded.save_simulator_state,
           preferred_theme=excluded.preferred_theme,
           updated_at=datetime('now')`,
			args: [
				settings.userId,
				settings.savePolicy,
				settings.autoSaveSeconds,
				settings.saveChatHistory ? 1 : 0,
				settings.saveSimulatorState ? 1 : 0,
				settings.theme,
			],
		});
	}
}
