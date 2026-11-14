

const MODEL = "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const GITHUB_RELEASE_URL =
  "https://api.github.com/repos/kdrryan/DuniaTahu/releases/latest";

const CATEGORIES = [
  { id: "sains", name: "sains dan fisika sehari-hari" },
  { id: "alam", name: "alam, hewan, dan tumbuhan" },
  { id: "sejarah", name: "sejarah dunia" },
  { id: "teknologi", name: "teknologi dan cara kerja mesin" },
  { id: "tubuh", name: "tubuh manusia" },
  { id: "angkasa", name: "luar angkasa dan astronomi" },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function todayJakarta() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function parseAIJson(content) {
  if (typeof content !== "string") {
    throw new Error("Format jawaban AI tidak valid");
  }

  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

async function generateAI(env, prompt) {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY belum dikonfigurasi");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah AI edukasi DuniaTahu. Jawab secara akurat, menarik, mudah dipahami, dan hanya keluarkan JSON yang valid.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1,
      max_completion_tokens: 1800,
      response_format: {
        type: "json_object",
      },
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Groq error:", result);
    throw new Error(
      result.error?.message || "Gagal menghubungi layanan AI"
    );
  }

  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI tidak menghasilkan jawaban");
  }

  return parseAIJson(content);
}

// ==========================================
// GITHUB VERSION CHECK
// ==========================================

async function getLatestVersion() {
  const response = await fetch(GITHUB_RELEASE_URL, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "DuniaTahu-Updater",
    },
    cf: {
      cacheTtl: 300,
      cacheEverything: true,
    },
  });

  if (!response.ok) {
    console.error("GitHub release request failed:", response.status);

    return json(
      { error: "Informasi versi tidak tersedia" },
      502
    );
  }

  const release = await response.json();

  const apk = release.assets?.find((asset) =>
    asset.name.toLowerCase() === "app-release.apk"
  );

  if (!apk) {
    return json(
      { error: "File pembaruan tidak ditemukan" },
      404
    );
  }

  return json({
    version: release.tag_name.replace(/^v/, ""),
    tag: release.tag_name,
    name: release.name,
    notes: release.body || "",
    apk_url: apk.browser_download_url,
    published_at: release.published_at,
  });
}

// ==========================================
// ASK WORLD
// ==========================================

async function askWorld(request, env) {
  const body = await request.json().catch(() => ({}));

  const question =
    typeof body.question === "string"
      ? body.question.trim().slice(0, 300)
      : "";

  const lang = body.lang === "en" ? "en" : "id";

  if (!question) {
    return json({ code: "empty_question" }, 400);
  }

  const prompt = [
    "You are Tanya Dunia, the helpful curiosity guide inside DuniaTahu.",
    `User message: """${question}"""`,
    lang === "en"
      ? "Write every user-facing field in natural English."
      : "Tulis semua bagian yang ditujukan kepada pengguna dalam Bahasa Indonesia yang natural.",
    "First understand the user's intent, then choose the appropriate response style:",
    "- Greetings, thanks, acknowledgements, and casual conversation: respond warmly and naturally in 1-2 short sentences. Do not force an educational lecture.",
    "- Very short or simple factual questions: answer directly in 1-3 clear sentences, adding a brief explanation only when useful.",
    "- Educational or explanatory questions: give a clear, well-structured explanation, usually 120-220 words.",
    "For explanatory answers, use clean Markdown only when useful. Put every ## or ### heading on its own new line, leave a blank line before and after headings, and put each list item on its own line using - or 1. syntax. Never place a heading or list marker in the middle of a paragraph. Use **bold** sparingly for important terms. Do not output decorative bullet characters (•).",
    "Explain both why and how when relevant. Start with the direct answer before adding context or examples. Keep the explanation focused and avoid repeating the same point in the quick_facts.",
    "Scientific accuracy rules: distinguish correlation from causation; do not present a correlation as proof or as a rule for every individual. Avoid absolute words such as always, never, entirely, or proves unless they are genuinely justified. Do not invent numerical values, study findings, mechanisms, named researchers, or citations. When scientific evidence is mixed, limited, or uncertain, say so briefly. Do not oversimplify complex topics into a single cause; explain the main interacting factors instead.",
    "For biology and neuroscience, do not claim that one brain region, neuron density, or brain measurement alone determines intelligence or behavior. Explain that complex abilities usually involve multiple interacting brain networks and are influenced by both biological and environmental factors. Only mention specific measurements or statistics when they are well-established and relevant.",
    "Be accurate, age-accessible, warm, and conversational. If a question contains a false or unsupported premise, correct it politely before explaining. If a question is ambiguous, briefly ask what the user means instead of guessing.",
    "The title should be concise and relevant. For greetings or casual messages, it may be empty.",
    "quick_facts should contain up to three useful supporting facts for educational answers. For greetings or casual conversation, return an empty array. Each item must be concise.",
    'Return valid JSON only with this structure: {"title":"short title or empty string","answer":"answer using optional Markdown","quick_facts":["fact 1","fact 2"]}',
  ].join("\n");

  const generated = await generateAI(env, prompt);
  const answer =
    typeof generated.answer === "string" ? generated.answer.trim() : "";

  if (!answer) {
    throw new Error("AI_INVALID_RESPONSE");
  }

  const quickFacts = Array.isArray(generated.quick_facts)
    ? generated.quick_facts
        .filter((item) => typeof item === "string" && item.trim())
        .slice(0, 3)
        .map((item) => item.trim().slice(0, 220))
    : [];

  return json({
    title: String(generated.title || "").slice(0, 120),
    answer: answer.slice(0, 4000),
    quick_facts: quickFacts,
    lang,
    engine: "groq/" + MODEL,
  });
}

// ==========================================
// DAILY FACT
// ==========================================

async function dailyFact(request, env) {
  if (!env.DB) {
    throw new Error("Database D1 belum terhubung");
  }

  const body = await request.json().catch(() => ({}));
  const lang = body.lang === "en" ? "en" : "id";
  const date = todayJakarta();

  const cached = await env.DB.prepare(
    "SELECT * FROM daily_facts WHERE date = ? AND lang = ?"
  )
    .bind(date, lang)
    .first();

  if (cached) {
    return json({ fact: cached, cached: true });
  }

  const seed = Number(date.replace(/-/g, ""));
  const category = CATEGORIES[seed % CATEGORIES.length];

  const recent = await env.DB.prepare(
    "SELECT fact FROM daily_facts WHERE lang = ? ORDER BY date DESC LIMIT 20"
  )
    .bind(lang)
    .all();

  const previousFacts = (recent.results || [])
    .map((item) => item.fact)
    .filter(Boolean);

  const prompt = [
    "Buat satu fakta pengetahuan umum yang akurat, mengejutkan, dan menarik.",
    `Tema internal: ${category.name}.`,
    lang === "en"
      ? "Write entirely in natural English."
      : "Tulis sepenuhnya dalam Bahasa Indonesia yang natural.",
    "Aturan:",
    "- Pilih fakta sains populer yang benar dan bisa dijelaskan.",
    "- Hindari mitos, politik, dan topik kesehatan pribadi.",
    "- Gunakan bahasa sederhana dan mudah dipahami.",
    "- fact maksimal 400 karakter.",
    "- detail maksimal 900 karakter.",
    "- emoji harus sesuai dengan fakta.",
    "- Jangan mengulang fakta berikut:",
    ...previousFacts.map((fact) => `- ${fact}`),
    'Keluarkan JSON: {"emoji":"💡","fact":"fakta utama","detail":"penjelasan tambahan"}',
  ].join("\n");

  const generated = await generateAI(env, prompt);

  if (!generated.fact) {
    throw new Error("Fakta harian gagal dibuat");
  }

  await env.DB.prepare(
    `INSERT OR IGNORE INTO daily_facts
      (date, lang, category, emoji, fact, detail)
      VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      date,
      lang,
      category.id,
      String(generated.emoji || "💡").slice(0, 8),
      String(generated.fact).slice(0, 400),
      String(generated.detail || "").slice(0, 900)
    )
    .run();

  const saved = await env.DB.prepare(
    "SELECT * FROM daily_facts WHERE date = ? AND lang = ?"
  )
    .bind(date, lang)
    .first();

  return json({ fact: saved, cached: false });
}

// ==========================================
// MAIN WORKER
// ==========================================

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    try {
      // Version check: GET
      if (
        url.pathname === "/api/version" &&
        request.method === "GET"
      ) {
        return await getLatestVersion();
      }

      // Other endpoints require POST
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      if (url.pathname === "/api/askWorld") {
        return await askWorld(request, env);
      }

      if (url.pathname === "/api/dailyFact") {
        return await dailyFact(request, env);
      }

      return json({ error: "Endpoint tidak ditemukan" }, 404);
    } catch (error) {
      console.error("Worker error:", error);

      return json(
        {
          error: error.message || "Terjadi kesalahan pada server",
        },
        500
      );
    }
  },
};
