const API_ROOT = 'https://api.elevenlabs.io/v1';
const DEFAULT_TTS_MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_monolingual_v1';
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL';
const DEFAULT_STT_MODEL =
	process.env.ELEVENLABS_STT_MODEL ?? 'scribe_v1';

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
		`${API_ROOT}/text-to-speech/${options.voiceId ?? DEFAULT_VOICE}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'xi-api-key': apiKey,
			},
			body: JSON.stringify({
				text: options.text,
				model_id: options.modelId ?? DEFAULT_TTS_MODEL,
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

export async function transcribeSpeechWithElevenLabs(
	audioBuffer: ArrayBuffer,
	mimeType?: string,
): Promise<string | null> {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		return null;
	}

	const form = new FormData();
	const extension = mimeType?.split('/')?.[1] ?? 'webm';
	const blob = new Blob([audioBuffer], { type: mimeType ?? 'audio/webm' });
	form.append('file', blob, `voice.${extension}`);
	form.append('model_id', DEFAULT_STT_MODEL);

	const response = await fetch(`${API_ROOT}/speech-to-text`, {
		method: 'POST',
		headers: { 'xi-api-key': apiKey },
		body: form,
	});

	if (!response.ok) {
		const errorText = await safeReadText(response);
		throw new Error(`ElevenLabs STT error (${response.status}): ${errorText}`);
	}

	const json = (await response.json()) as { text?: string };
	return typeof json?.text === 'string' && json.text.length > 0
		? json.text
		: null;
}

async function safeReadText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return '<no error body>';
	}
}
