import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { generateJson } from "../../shared/ai.ts";

const CATEGORIES = {
  sains: "sains & fisika sehari-hari",
  sejarah: "sejarah dunia",
  alam: "alam, hewan & tumbuhan",
  teknologi: "teknologi & cara kerja mesin",
  tubuh: "tubuh manusia",
  angkasa: "luar angkasa & astronomi",
};

const ORDER = ["sains", "alam", "sejarah", "teknologi", "tubuh", "angkasa"];

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const FACT_SCHEMA = {
  type: "object",
  properties: {
    fact: {
      type: "string",
      description: 'Satu kalimat fakta yang mengejutkan, maksimal 110 karakter, tanpa pembuka seperti "Tahukah kamu".',
    },
    detail: {
      type: "string",
      description: "Dua atau tiga kalimat yang menjelaskan bagaimana hal itu terjadi, 200-400 karakter.",
    },
    emoji: { type: "string", description: "Tepat satu emoji yang mewakili fakta tersebut." },
  },
  required: ["fact", "detail", "emoji"],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const lang = body?.lang === "en" ? "en" : "id";
    const today = todayKey();

    const existing = await base44.asServiceRole.entities.DailyFact.filter({ date: today, lang });
    const stored = Array.isArray(existing) ? existing[0] : null;
    if (stored) return Response.json({ fact: stored, cached: true });

    const recent = await base44.asServiceRole.entities.DailyFact.filter({}, { sort: "-date", limit: 20 });
    const recentFacts = (recent?.items || []).map((item) => item.fact).filter(Boolean);

    const seed = Number(today.replace(/-/g, "")) || 0;
    const category = ORDER[seed % ORDER.length];

    const prompt = [
      "Kamu penulis konten sains populer untuk aplikasi 'Tanya Dunia'.",
      `Tulis SATU fakta menarik dan benar tentang bagaimana dunia bekerja, dengan tema ${CATEGORIES[category]}.`,
      "Aturan:",
      lang === "en"
        ? "- Tulis fact dan detail dalam Bahasa Inggris yang natural, santai, dan ramah."
        : "- Tulis fact dan detail dalam Bahasa Indonesia yang natural, santai, dan ramah.",
      "- Fakta harus akurat dan bisa dipertanggungjawabkan, bukan mitos.",
      "- Gaya santai dan ramah, mudah dipahami orang awam, tanpa istilah rumit tanpa penjelasan.",
      "- Jangan menyinggung topik sensitif, politik, atau kesehatan pribadi.",
      recentFacts.length
        ? `- Jangan mengulang fakta berikut: ${recentFacts.join(" | ")}`
        : "- Pilih fakta yang jarang diketahui orang.",
    ].join("\n");

    const generated = await generateJson(base44, { prompt, schema: FACT_SCHEMA });
    if (!generated?.fact) {
      return Response.json({ error: "Fakta hari ini gagal dibuat" }, { status: 502 });
    }

    const record = await base44.asServiceRole.entities.DailyFact.create({
      date: today,
      lang,
      category,
      emoji: (generated.emoji || "✨").slice(0, 8),
      fact: String(generated.fact).slice(0, 400),
      detail: String(generated.detail || "").slice(0, 900),
    });

    return Response.json({ fact: record, cached: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}