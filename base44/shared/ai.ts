import { secrets } from "base44:runtime";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

// Opsional: kalau pengguna menyambungkan API key Groq, GPT-OSS 120B yang menjawab.
// Tanpa key, semua permintaan memakai InvokeLLM bawaan Base44.
function getGroqKey() {
  try {
    return secrets.get("GROQ_API_KEY") || null;
  } catch {
    return null;
  }
}

function parseJson(text) {
  if (!text) return null;
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

async function callGroq(key, prompt, schema) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah mesin konten aplikasi 'Tanya Dunia'. Selalu balas HANYA dengan objek JSON valid, tanpa penjelasan tambahan.",
        },
        {
          role: "user",
          content: `${prompt}\n\nBalas sebagai satu objek JSON dengan bentuk berikut:\n${JSON.stringify(schema)}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(40000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return parseJson(data?.choices?.[0]?.message?.content);
}

let lastEngine = "base44";

export function getLastEngine() {
  return lastEngine;
}

export async function generateJson(base44, { prompt, schema }) {
  const key = getGroqKey();
  if (key) {
    try {
      const viaGroq = await callGroq(key, prompt, schema);
      if (viaGroq) {
        lastEngine = "groq/gpt-oss-120b";
        return viaGroq;
      }
    } catch {
      // Groq gagal — lanjut ke AI bawaan Base44
    }
  }

  lastEngine = "base44";
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
  });

  if (typeof result === "string") return parseJson(result);
  return result || null;
}