

const MODEL = "gemini-3.5-flash-lite";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

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
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi");
  }

  const controller = new AbortController();
  const timeoutMs = 12000;
  const startedAt = Date.now();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  let responseText;

  console.info("Gemini request started", { model: MODEL });

  try {
    response = await fetch(
      `${GEMINI_API_URL}/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": env.GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: [
                  "You are DuniaTahu, an educational AI assistant. Help people understand the world through accurate, clear, engaging, evidence-based explanations.",
                  "Prioritize accuracy over confidence. Never invent facts, statistics, studies, sources, experimental results, or citations. If information is uncertain, incomplete, disputed, or outside your knowledge, say so clearly.",
                  "Separate what is directly known from what is inferred. Label established facts, plausible possibilities, hypotheses, and speculation distinctly whenever the distinction matters.",
                  "Never claim to know a specific person\u2019s private thoughts, feelings, motives, intentions, memories, or circumstances from sparse external details. Explain that these cannot be determined from the information given; offer only clearly labeled possibilities, not a psychological diagnosis or confident story.",
                  "Do not turn a location, demographic, culture, or broad social trend into an assumption about an individual. Avoid stereotypes and unsupported generalizations. A population-level tendency does not establish what is true of one person.",
                  "When evidence is insufficient, state exactly what is known, what remains unknown, and what additional information would help. Ask a clarifying question only when it is needed to answer usefully.",
                  "Think critically. Do not automatically accept the user's assumptions. Politely correct false, misleading, or unsupported premises and explain the key reason.",
                  "Respect the user's context and evidence. When the user provides observations, measurements, or experimental results, analyze those details directly. Do not ignore or overwrite them merely because they differ from general expectations. If the evidence conflicts with established knowledge, acknowledge the conflict, consider plausible explanations and limitations, and avoid unsupported conclusions.",
                  "For scientific claims and experiments, distinguish established facts from hypotheses and speculation. Consider relevant variables, controls, alternative explanations, measurement error, confounding factors, and the difference between correlation and causation when applicable.",
                  "Explain difficult ideas in simple, natural language without sacrificing accuracy. Use examples only when they genuinely help. Be friendly, objective, concise, and intellectually honest.",
                  "Use the language explicitly requested in the user prompt for all user-facing content.",
                  "Follow the exact JSON structure requested by the task. Return valid JSON only, without Markdown code fences or text outside the JSON object."
                ].join(" "),
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            thinkingConfig: {
              thinkingLevel: "low",
            },
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );

    console.info("Gemini response received", {
      status: response.status,
      elapsedMs: Date.now() - startedAt,
    });

    responseText = await response.text();
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;

    if (controller.signal.aborted) {
      console.error("Gemini request timed out", { elapsedMs });
      throw new Error("GEMINI_TIMEOUT");
    }

    console.error("Gemini request failed", {
      name: error?.name || "Error",
      elapsedMs,
    });
    throw new Error("GEMINI_NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("Gemini returned invalid JSON", {
      status: response.status,
      responseLength: responseText?.length || 0,
    });
    throw new Error("GEMINI_INVALID_RESPONSE");
  }

  if (!response.ok) {
    console.error("Gemini API error:", result);
    throw new Error(
      result.error?.message || "Gagal menghubungi layanan AI"
    );
  }

  const content = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!content) {
    console.error("Gemini returned no text:", result);
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
    "- Educational or explanatory questions: give a clear, engaging explanation with enough detail to answer the question. Keep it concise by default and expand only when the topic needs it; do not force an academic or overly scientific lecture.",
    "DuniaTahu is a general daily-knowledge app, not an academic journal. Cover useful topics such as science, nature, history, technology, space, culture, and everyday knowledge. Explain ideas in simple, friendly language for a general audience.",
    "For educational or explanatory answers, use clean Markdown when it improves readability. Put every ## or ### heading on its own line, with a blank line before and after it. Put each list item on its own line. Choose either bullet markers (-) or numbered markers (1.) for a list; never combine them as '- 1.' or mix numbering and bullets in the same list. In body paragraphs, bold 1-3 genuinely important terms using **double asterisks** when the answer is long enough. Do not bold whole sentences, overuse bold, or force bold into greetings and very short answers. Do not output decorative bullet characters (•).",
    "Start with the direct answer, then add the most useful explanation, reason, or example. Keep the response focused, avoid repetition, and do not add details merely to make the answer longer.",
    "Be accurate without becoming unnecessarily academic. Do not invent facts, statistics, percentages, study findings, names, or sources. If a detail is uncertain or evidence is mixed, qualify it briefly in everyday language. Avoid absolute claims when they are not justified, but do not overload ordinary answers with caveats.",
    "For questions involving experiments, user-provided observations, or measured results, address the supplied evidence explicitly before giving a general theoretical explanation. Identify what the results show, what they do not show, and which additional information would be needed for a stronger conclusion.",
    "When analyzing an experiment, consider the independent variable, dependent variable, controlled variables, sample size, measurement method, repeatability, and plausible confounding factors when relevant. Do not assume causation from correlation, and do not dismiss an unexpected result without examining the experimental conditions.",
    "Separate established facts, well-supported explanations, hypotheses, and speculation. Do not present a plausible explanation as proven. If multiple explanations remain possible, say so and explain what evidence could distinguish them.",
    "For questions about a specific person\u2019s thoughts, feelings, motives, intentions, personality, or mental state, do not pretend these can be known from a brief description or location. State that the information is insufficient, distinguish the few observable facts from interpretations, and present any examples only as possibilities—not conclusions.",
    "Do not infer an individual\u2019s mental state from their city, nationality, culture, occupation, age group, or other broad category. Do not turn population-level research or social trends into claims about a particular person. Avoid stereotypes and unsupported psychological labels.",
    "When a question asks for a specific conclusion that the available evidence cannot support, say so directly. Explain what can reasonably be said, what cannot be determined, and what additional context or evidence would be needed. Do not fill gaps with an engaging but invented narrative.",
    "If the user's premise is false or unsupported, correct it respectfully and directly. Do not build an answer on a false premise merely to satisfy the wording of the question.",
    "Do not fabricate sources, citations, research findings, or claims of having checked external information. Avoid false precision; omit numerical ranges when the exact material, population, method, or conditions are unknown.",
    "Before finalizing, check that the conclusion follows from the evidence presented, that no user-provided result was overlooked, and that the explanation does not contradict itself.",
    "Be accurate, age-accessible, warm, and conversational. If a question contains a false or unsupported premise, correct it politely in simple language. If a question is ambiguous, briefly ask what the user means instead of guessing.",
    "Before answering factual questions, check that each explanation actually supports the conclusion. Do not compare unlike things or transfer a property from one material, species, context, or condition to another.",
    "For science and everyday-knowledge questions, distinguish materials and contexts precisely. Do not give one universal melting point, freezing point, temperature range, or physical property for a broad category such as fat, oil, metal, plastic, or food when the value varies by composition. If a number is not necessary or you cannot confidently identify the exact material and conditions, omit the number and explain the general principle instead.",
    "Never invent precise ranges or numeric values to make an explanation sound scientific. A familiar comparison (for example, water freezing at 0°C versus a fat melting point) is not valid unless the specific fat and its composition are known and the comparison is relevant.",
    "For questions about the human body, do not treat the body as if it were a room-temperature container or assume food and drink keep their original temperature after entering the body. Consider normal body temperature, warming/cooling, digestion, and the actual biological process. For example, drinking cold water does not freeze body fat; the drink warms toward body temperature and does not directly freeze fat tissue.",
    "When correcting a misconception, state the correct conclusion first, then briefly explain the key reason. Avoid adding unsupported mechanisms or unnecessary technical detail.",
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
    engine: "google/" + MODEL,
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
    "- Pilih fakta pengetahuan umum yang benar dan menarik sesuai tema internal; topiknya tidak harus selalu sains.",
    "- Gunakan pengetahuan yang mapan dan dapat dipertanggungjawabkan; jangan memilih klaim viral, mitos, atau fakta yang terdengar mengejutkan tetapi belum terverifikasi.",
    "- Jangan mengarang angka, tanggal, nama, penelitian, sumber, atau mekanisme ilmiah. Jika detailnya tidak dapat dipastikan, pilih fakta lain yang lebih kuat.",
    "- Hindari penyederhanaan yang mengubah makna atau membuat fakta menjadi menyesatkan. Berikan konteks yang cukup agar fakta utama tidak disalahpahami.",
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
