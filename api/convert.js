// api/convert.js
// Vercel Serverless Function — uses Groq (FREE)
// Get your free key at: https://console.groq.com

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
// Keeps a hit count per IP. Resets automatically when the serverless instance
// is recycled. Fine for a low-traffic tool; swap for Redis/Upstash if needed.
const RATE_LIMIT = 10;          // max requests
const RATE_WINDOW_MS = 60_000;  // per minute
const rateMap = new Map();      // { ip -> { count, windowStart } }

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // ── API key validation ──────────────────────────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY environment variable is not set.");
    return res.status(500).json({
      error:
        "Server misconfiguration: GROQ_API_KEY is not set. " +
        "Add it in Vercel → Settings → Environment Variables.",
    });
  }
  // ───────────────────────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Rate limiting ───────────────────────────────────────────────────────────
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: `Too many requests. Please wait a minute and try again.`,
    });
  }
  // ───────────────────────────────────────────────────────────────────────────

  const { cvText, jobTitle } = req.body;

  if (!cvText || cvText.trim().length === 0) {
    return res.status(400).json({ error: "CV text is required" });
  }

  if (cvText.length > 20000) {
    return res.status(400).json({ error: "CV text is too long (max 20,000 characters)" });
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) CV optimizer.
${jobTitle ? `The target job role is: "${jobTitle}"` : ""}

Analyze the CV below and return ONLY a valid JSON object (no markdown, no explanation, just raw JSON) in this exact structure:

{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "City, Country",
  "linkedin": "linkedin URL or empty string",
  "summary": "2-3 sentence professional summary optimized for ATS",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Dec 2022",
      "bullets": [
        "Achievement or responsibility with action verb and metrics",
        "Another bullet point"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "2019"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": ["Certification 1"],
  "languages": [
    { "language": "Arabic", "level": "Native" },
    { "language": "English", "level": "Fluent" }
  ],
  "hobbies": ["Reading", "Football", "Photography"],
  "references": [
    {
      "name": "Reference Name",
      "title": "Their Job Title",
      "company": "Their Company",
      "contact": "email or phone"
    }
  ],
  "score": 85,
  "tips": [
    "Tip 1 to improve ATS score",
    "Tip 2 to improve ATS score",
    "Tip 3 to improve ATS score"
  ]
}

Rules:
- Extract ALL experience entries with their dates/duration — never leave duration empty
- Each bullet point must start with a strong action verb
- Skills should be individual items, not sentences
- Extract ALL languages mentioned with proficiency level
- Extract ALL hobbies or interests if mentioned
- Extract references if mentioned, or use empty array []
- If references say "available upon request" use: [{ "name": "Available upon request", "title": "", "company": "", "contact": "" }]
- Score is ATS compatibility out of 100
- If a field has no data, use empty string "" or empty array []
- Return ONLY the JSON, nothing else

CV to analyze:
${cvText}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Groq API error:", err);
      if (response.status === 401) {
        return res.status(500).json({
          error:
            "Invalid GROQ_API_KEY. Check your key at https://console.groq.com and update the environment variable.",
        });
      }
      if (response.status === 429) {
        return res.status(429).json({
          error: "Groq rate limit reached. Please try again in a moment.",
        });
      }
      return res.status(500).json({ error: "AI service error. Please try again." });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    if (!text) {
      return res.status(500).json({ error: "Empty response from AI. Please try again." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return res.status(200).json({ result: parsed });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error: " + error.message });
  }
}