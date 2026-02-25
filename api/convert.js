// api/convert.js
// Vercel Serverless Function — uses Google Gemini Flash (FREE)
// Get your free key at: https://aistudio.google.com

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cvText, jobTitle } = req.body;

  if (!cvText || cvText.trim().length === 0) {
    return res.status(400).json({ error: "CV text is required" });
  }

  if (cvText.length > 20000) {
    return res.status(400).json({ error: "CV text is too long (max 20,000 characters)" });
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) CV optimizer. 

The user has provided their CV content. Your job is to:
1. Parse and understand their experience, skills, education, and achievements
2. Reformat it into a clean, ATS-friendly CV
3. Use standard section headers (PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS if applicable)
4. Use simple bullet points with action verbs and quantifiable achievements
5. Remove tables, columns, graphics, special characters
6. Optimize keywords for ATS scanning
7. Keep formatting simple: plain text with clear section breaks
${jobTitle ? `8. Tailor the CV for this target role: "${jobTitle}"` : ""}

After the CV, add a section called "--- ATS SCORE & TIPS ---" and give:
- An ATS compatibility score out of 100 (format: SCORE: XX/100)
- 3-4 specific improvement tips

Here is the CV to convert:

${cvText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return res.status(500).json({ error: "AI service error. Please try again." });
    }

    const data = await response.json();

    // Extract text from Gemini's response structure
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return res.status(500).json({ error: "Empty response from AI. Please try again." });
    }

    return res.status(200).json({ result: text });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
}