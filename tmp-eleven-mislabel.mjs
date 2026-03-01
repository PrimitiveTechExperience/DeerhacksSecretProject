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
  } catch {}
  return undefined;
}

const API_ROOT = "https://api.elevenlabs.io/v1";
const apiKey = loadEnvValue("ELEVENLABS_API_KEY");
const voiceId = loadEnvValue("ELEVENLABS_VOICE_ID") || "EXAVITQu4vr4xnSDxMaL";
const ttsModel = loadEnvValue("ELEVENLABS_MODEL") || "eleven_monolingual_v1";
const sttModel = loadEnvValue("ELEVENLABS_STT_MODEL") || "scribe_v1";
if (!apiKey) {
  console.error("Missing key");
  process.exit(1);
}

const ttsResponse = await fetch(`${API_ROOT}/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ text: "Hello from mislabeled audio", model_id: ttsModel }),
});
if (!ttsResponse.ok) {
  console.error("tts failed", await ttsResponse.text());
  process.exit(1);
}
const buffer = await ttsResponse.arrayBuffer();
const blob = new Blob([buffer], { type: "audio/webm" });
const form = new FormData();
form.append("file", blob, "tts-as-webm.webm");
form.append("model_id", sttModel);
const sttResponse = await fetch(`${API_ROOT}/speech-to-text`, {
  method: "POST",
  headers: { "xi-api-key": apiKey },
  body: form,
});
console.log("status", sttResponse.status);
console.log(await sttResponse.text());
