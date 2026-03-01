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
const sttModel = loadEnvValue("ELEVENLABS_STT_MODEL") || "scribe_v1";
if (!apiKey) {
  console.error("Missing api key");
  process.exit(1);
}

const silenceBuffer = new Uint8Array(16000);
const blob = new Blob([silenceBuffer], { type: "audio/webm" });
const form = new FormData();
form.append("file", blob, "silence.webm");
form.append("model_id", sttModel);

const response = await fetch(`${API_ROOT}/speech-to-text`, {
  method: "POST",
  headers: { "xi-api-key": apiKey },
  body: form,
});

console.log("status", response.status);
console.log(await response.text());
