import { supabase } from "@/lib/supabaseClient";

export interface RubricMarks {
  critical_thinking: number | string;
  ideation: number | string;
  storytelling: number | string;
  conceptualisation: number | string;
  representation: number | string;
}

export interface EvaluationResult {
  rubric_marks: RubricMarks;
  marks_awarded: number;
  mentor_comments: string;
  mentor_improvements: string;
  word_count: number;
}

/**
 * Fetch Gemini API configurations from system_settings
 */
export async function getGeminiSettings(): Promise<{ apiKey: string; model: string }> {
  try {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value");

    const apiKey = data?.find(d => d.key === "gemini_api_key")?.value || "";
    let model = data?.find(d => d.key === "gemini_api_model")?.value || "gemini-flash-latest";

    if (model.startsWith("gemini-1.5") || model === "gemini-2.5-flash") {
      model = "gemini-flash-latest";
    }

    return { apiKey, model };
  } catch (err) {
    console.error("Failed to fetch Gemini settings:", err);
    return { apiKey: "", model: "gemini-flash-latest" };
  }
}

/**
 * Utility to convert an image URL or Blob into base64 inlineData for Gemini API
 */
async function urlToBase64InlineData(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      return { mimeType, data: parts[1] };
    }

    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return {
      mimeType: blob.type || "image/jpeg",
      data: base64
    };
  } catch (e) {
    console.warn("Could not load image for Gemini evaluation:", url, e);
    return null;
  }
}

/**
 * Enforce strict 20-25 word limit on review comments
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function adjustToWordLimit(text: string, minWords = 20, maxWords = 25): { text: string; wordCount: number } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const count = words.length;

  if (count >= minWords && count <= maxWords) {
    return { text: words.join(" "), wordCount: count };
  }

  if (count > maxWords) {
    // Truncate cleanly at 24 or 25 words with a period
    const truncated = words.slice(0, 24).join(" ");
    const cleanText = truncated.replace(/[,;:\-\s]+$/, "") + ".";
    return { text: cleanText, wordCount: countWords(cleanText) };
  }

  // If slightly under 20 words, pad thoughtfully with design feedback
  const fillers = [
    "Focus closely on perspective accuracy and line hierarchy for next attempt.",
    "Refine spatial proportion and emphasize focal contrast to elevate presentation quality.",
    "Maintain clean line consistency and articulate form through deliberate tonal shading."
  ];

  let current = words.join(" ");
  for (const filler of fillers) {
    if (countWords(current) >= minWords) break;
    current = `${current.replace(/\.?$/, ".")} ${filler}`;
  }

  const finalWords = current.split(/\s+/).filter(Boolean);
  if (finalWords.length > maxWords) {
    const trimmed = finalWords.slice(0, 24).join(" ").replace(/[,;:\-\s]+$/, "") + ".";
    return { text: trimmed, wordCount: countWords(trimmed) };
  }

  return { text: finalWords.join(" "), wordCount: finalWords.length };
}

/**
 * Evaluate a single Part B subjective response using Gemini
 */
export async function evaluatePartBWithGemini(params: {
  questionText: string;
  questionMediaUrl?: string | null;
  candidateFileUrl?: string | null;
  candidateAnswerText?: string | null;
  maxMarks: number;
  apiKey?: string;
  model?: string;
}): Promise<EvaluationResult> {
  const { questionText, questionMediaUrl, candidateFileUrl, candidateAnswerText, maxMarks } = params;

  let apiKey = params.apiKey;
  let model = params.model || "gemini-flash-latest";

  if (!apiKey) {
    const settings = await getGeminiSettings();
    apiKey = settings.apiKey;
    if (settings.model) model = settings.model;
  }

  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add it in Admin Settings.");
  }

  const maxPerCriteria = Math.round((maxMarks / 5) * 10) / 10;

  // Build multimodal content parts
  const contentParts: any[] = [];

  // Add system instruction / prompt
  const systemPrompt = `You are a senior design exam evaluator for premier national design institutes (NID, CEED, UCEED).
You are evaluating a student's subjective design / sketching submission for Part B.

EXAM QUESTION:
${questionText.replace(/<[^>]*>/g, " ")}

GRADING RUBRIC (Total Max Marks: ${maxMarks}):
Score each of the 5 criteria from 0.0 up to a maximum of ${maxPerCriteria} marks:
1. Critical Thinking (problem understanding, constraints, relevance)
2. Ideation (originality, uniqueness, depth of exploration)
3. Storytelling (communication, context, flow)
4. Conceptualisation (design logic, feasibility, usability)
5. Representation (sketching skill, proportion, perspective, linework, rendering)

MANDATORY REVIEW INSTRUCTION:
Write a mentor critique ('mentor_comments') strictly between 20 and 25 words in length.
- Give constructive, sharp, direct feedback on the student's concept and visual execution.
- COUNT YOUR WORDS CAREFULLY. The word count MUST be between 20 and 25 words.

Also provide a brief 1-sentence tip in 'mentor_improvements' (10-15 words).`;

  contentParts.push({ text: systemPrompt });

  // Attach reference image if question has one
  if (questionMediaUrl) {
    const refImg = await urlToBase64InlineData(questionMediaUrl);
    if (refImg) {
      contentParts.push({ text: "[Question Reference Image]:" });
      contentParts.push({
        inlineData: {
          mimeType: refImg.mimeType,
          data: refImg.data
        }
      });
    }
  }

  // Attach student sketch submission if available
  if (candidateFileUrl) {
    let rawUrls: string[] = [];
    try {
      if (candidateFileUrl.startsWith("[")) {
        rawUrls = JSON.parse(candidateFileUrl);
      } else {
        rawUrls = [candidateFileUrl];
      }
    } catch {
      rawUrls = [candidateFileUrl];
    }

    for (let i = 0; i < Math.min(rawUrls.length, 3); i++) {
      const sketchImg = await urlToBase64InlineData(rawUrls[i]);
      if (sketchImg) {
        contentParts.push({ text: `[Student Submission Sketch Page ${i + 1}]:` });
        contentParts.push({
          inlineData: {
            mimeType: sketchImg.mimeType,
            data: sketchImg.data
          }
        });
      }
    }
  }

  // Attach student text answer if present
  if (candidateAnswerText && candidateAnswerText.trim()) {
    contentParts.push({
      text: `[Student Written Explanation / Concept Note]:\n${candidateAnswerText}`
    });
  }

  // Define JSON schema
  const responseSchema = {
    type: "OBJECT",
    properties: {
      critical_thinking: { type: "NUMBER", description: `Score between 0 and ${maxPerCriteria}` },
      ideation: { type: "NUMBER", description: `Score between 0 and ${maxPerCriteria}` },
      storytelling: { type: "NUMBER", description: `Score between 0 and ${maxPerCriteria}` },
      conceptualisation: { type: "NUMBER", description: `Score between 0 and ${maxPerCriteria}` },
      representation: { type: "NUMBER", description: `Score between 0 and ${maxPerCriteria}` },
      mentor_comments: { type: "STRING", description: "Feedback strictly between 20 and 25 words" },
      mentor_improvements: { type: "STRING", description: "Single-sentence actionable improvement tip" }
    },
    required: [
      "critical_thinking",
      "ideation",
      "storytelling",
      "conceptualisation",
      "representation",
      "mentor_comments",
      "mentor_improvements"
    ]
  };

  const payload = {
    contents: [{ parts: contentParts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema
    }
  };

  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok && model !== "gemini-flash-latest") {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const resData = await response.json();
  const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("No evaluation response received from Gemini.");
  }

  const parsed = JSON.parse(rawText);

  // Clamp and format rubric values
  const clampScore = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(maxPerCriteria, Math.round(num * 10) / 10));
  };

  const critical_thinking = clampScore(parsed.critical_thinking);
  const ideation = clampScore(parsed.ideation);
  const storytelling = clampScore(parsed.storytelling);
  const conceptualisation = clampScore(parsed.conceptualisation);
  const representation = clampScore(parsed.representation);

  const totalSum = Math.round((critical_thinking + ideation + storytelling + conceptualisation + representation) * 10) / 10;

  // Enforce 20-25 word constraint strictly
  const { text: validatedComments, wordCount } = adjustToWordLimit(parsed.mentor_comments || "", 20, 25);

  return {
    rubric_marks: {
      critical_thinking: critical_thinking.toString(),
      ideation: ideation.toString(),
      storytelling: storytelling.toString(),
      conceptualisation: conceptualisation.toString(),
      representation: representation.toString()
    },
    marks_awarded: totalSum,
    mentor_comments: validatedComments,
    mentor_improvements: parsed.mentor_improvements || "",
    word_count: wordCount
  };
}
