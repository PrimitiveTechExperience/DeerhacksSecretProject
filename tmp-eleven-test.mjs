import fs from "node:fs";

function loadEnvValue(key) {
  if (process.env[key]) return process.env[key];
  try {
    const raw = fs.readFileSync(".env", "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const envKey = trimmed.slice(0, eqIndex).trim();
      if (envKey === key) {
        return trimmed.slice(eqIndex + 1).trim();
      }
    }
  } catch (err) {
    console.error("Failed to read .env", err);
  }
  return undefined;
}

const API_ROOT = "https://api.elevenlabs.io/v1";
const apiKey = loadEnvValue("ELEVENLABS_API_KEY");
const voiceId = loadEnvValue("ELEVENLABS_VOICE_ID") || "EXAVITQu4vr4xnSDxMaL";
const ttsModel = loadEnvValue("ELEVENLABS_MODEL") || "eleven_monolingual_v1";
const sttModel = loadEnvValue("ELEVENLABS_STT_MODEL") || "scribe_v1";

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY");
  process.exit(1);
}

const ttsResponse = await fetch(`${API_ROOT}/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
  },
  body: JSON.stringify({
    text: "Testing the simulator voice query transcription.",
    model_id: ttsModel,
  }),
});

if (!ttsResponse.ok) {
  const text = await ttsResponse.text();
  console.error("TTS request failed", ttsResponse.status, text);
  process.exit(1);
}

const audioBuffer = await ttsResponse.arrayBuffer();
const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
const form = new FormData();
form.append("file", audioBlob, "tts.mp3");
form.append("model_id", sttModel);

const sttResponse = await fetch(`${API_ROOT}/speech-to-text`, {
  method: "POST",
  headers: { "xi-api-key": apiKey },
  body: form,
});

const resultText = await sttResponse.text();
console.log("STT status", sttResponse.status);
console.log(resultText);
