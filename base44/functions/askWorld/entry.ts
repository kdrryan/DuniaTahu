import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { generateJson, getLastEngine } from "../../shared/ai.ts";

const CATEGORIES = {
  semua: "semua bidang (pilih sudut paling menarik)",
  sains: "sains & fisika sehari-hari",
  sejarah: "sejarah dunia",
  alam: "alam, hewan & tumbuhan",
  teknologi: "teknologi & cara kerja mesin",
  tubuh: "tubuh manusia",
  angkasa: "luar angkasa & astronomi",
};

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Judul jawaban yang memancing rasa penasaran, maksimal 60 karakter.",
    },
    answer: {
      type: "string",
      description:
        "Jawaban dalam markdown ringan: 2-4 paragraf pendek, boleh satu daftar berpoin. Tanpa judul markdown.",
    },
    quick_facts: {
      type: "array",
      description: "Tiga fakta singkat pendukung.",
      items: { type: "string" },
    },
  },
  required: ["title", "answer", "quick_facts"],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const question = typeof body?.question === "string" ? body.question.trim().slice(0, 300) : "";
    if (question.length < 3) {
      return Response.json({ error: "Pertanyaan terlalu pendek" }, { status: 400 });
    }

    const category = Object.prototype.hasOwnProperty.call(CATEGORIES, body?.category)
      ? body.category
      : "semua";
    const language = body?.lang === "en" ? "en" : "id";

    const prompt = [
      "Kamu adalah 'Tanya Dunia', pemandu rasa penasaran yang menjelaskan bagaimana dunia bekerja.",
      `Pertanyaan pengguna: """${question}"""`,
      `Fokus tema: ${CATEGORIES[category]}. Kalau pertanyaannya jauh dari tema itu, tetap jawab pertanyaannya dengan benar.`,
      "Aturan menjawab:",
      language === "en"
        ? "- Tulis title, answer, dan quick_facts sepenuhnya dalam Bahasa Inggris yang natural, meskipun pertanyaannya memakai bahasa lain."
        : "- Tulis title, answer, dan quick_facts sepenuhnya dalam Bahasa Indonesia yang natural, meskipun pertanyaannya memakai bahasa lain.",
      "- Akurat dan faktual. Jangan mengarang angka, nama, atau sumber.",
      "- Gaya bicara hangat, santai, seperti teman pintar. Hindari bahasa birokratis.",
      "- Jelaskan mekanismenya: kenapa dan bagaimana, bukan cuma apa.",
      "- Panjang 120-220 kata. Boleh satu daftar berpoin bila membantu.",
      "- quick_facts: tiga potongan fakta pendukung yang mengejutkan, masing-masing maksimal 130 karakter.",
    ].join("\n");

    const generated = await generateJson(base44, { prompt, schema: ANSWER_SCHEMA });
    if (!generated?.answer) {
      return Response.json({ error: "Jawaban gagal dibuat" }, { status: 502 });
    }

    return Response.json({
      title: String(generated.title || "").slice(0, 120),
      answer: String(generated.answer).slice(0, 4000),
      quick_facts: Array.isArray(generated.quick_facts)
        ? generated.quick_facts.slice(0, 3).map((item) => String(item).slice(0, 220))
        : [],
      category,
      lang: language,
      engine: getLastEngine(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}