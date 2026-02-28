const API_ROOT = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_monolingual_v1';
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL';

export interface ElevenLabsSynthesisOptions {
	text: string;
	voiceId?: string;
	modelId?: string;
	stability?: number;
	similarityBoost?: number;
}

export function hasElevenLabsApiKey(): boolean {
	return Boolean(process.env.ELEVENLABS_API_KEY);
}

export async function synthesizeSpeechWithElevenLabs(
	options: ElevenLabsSynthesisOptions,
): Promise<ArrayBuffer | null> {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		return null;
	}

	const response = await fetch(
		`${API_ROOT}/${options.voiceId ?? DEFAULT_VOICE}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'xi-api-key': apiKey,
			},
			body: JSON.stringify({
				text: options.text,
				model_id: options.modelId ?? DEFAULT_MODEL,
				voice_settings: {
					stability: options.stability ?? 0.5,
					similarity_boost: options.similarityBoost ?? 0.75,
				},
			}),
		},
	);

	if (!response.ok) {
		const errorText = await safeReadText(response);
		throw new Error(
			`ElevenLabs API error (${response.status}): ${errorText}`,
		);
	}

	return response.arrayBuffer();
}

async function safeReadText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return '<no error body>';
	}
}
