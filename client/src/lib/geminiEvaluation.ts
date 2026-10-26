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

export interface AISettings {
  provider: "openai" | "gemini";
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiModel: string;
}

/**
 * Fetch AI configuration from system_settings (OpenAI & Gemini)
 */
export async function getAISettings(): Promise<AISettings> {
  let openaiKey = "";
  let openaiModel = "gpt-4o-mini";
  let geminiKey = "";
  let geminiModel = "gemini-flash-latest";
  let provider: "openai" | "gemini" = "openai";

  // Check localStorage first
  try {
    if (typeof window !== "undefined") {
      const localOpenaiKey = localStorage.getItem("df_openai_api_key");
      if (localOpenaiKey) openaiKey = localOpenaiKey;
      const localOpenaiModel = localStorage.getItem("df_openai_api_model");
      if (localOpenaiModel) openaiModel = localOpenaiModel;
      const localGeminiKey = localStorage.getItem("df_gemini_api_key");
      if (localGeminiKey) geminiKey = localGeminiKey;
      const localGeminiModel = localStorage.getItem("df_gemini_api_model");
      if (localGeminiModel) geminiModel = localGeminiModel;
      const localProvider = localStorage.getItem("df_ai_provider") as "openai" | "gemini" | null;
      if (localProvider) provider = localProvider;
    }
  } catch (e) {}

  try {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value");

    const dbOpenai = data?.find(d => d.key === "openai_api_key")?.value;
    if (dbOpenai) openaiKey = dbOpenai;
    const dbOpenaiModel = data?.find(d => d.key === "openai_api_model")?.value;
    if (dbOpenaiModel) openaiModel = dbOpenaiModel;
    const dbGemini = data?.find(d => d.key === "gemini_api_key")?.value;
    if (dbGemini) geminiKey = dbGemini;
    const dbGeminiModel = data?.find(d => d.key === "gemini_api_model")?.value;
    if (dbGeminiModel) geminiModel = dbGeminiModel;

    const explicitProvider = data?.find(d => d.key === "ai_evaluation_provider")?.value as "openai" | "gemini" | undefined;
    if (explicitProvider) provider = explicitProvider;
  } catch (err) {
    console.warn("Could not read settings from DB, using cached/default settings:", err);
  }

  if (geminiModel.startsWith("gemini-1.5") || geminiModel === "gemini-2.5-flash") {
    geminiModel = "gemini-flash-latest";
  }

  return {
    provider,
    openaiKey,
    openaiModel,
    geminiKey,
    geminiModel
  };
}

/**
 * Fetch Gemini API configurations from system_settings (legacy wrapper)
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
 * Fast asynchronous Blob to Base64 using native browser FileReader (C++ engine)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = (reader.result as string) || "";
      const base64 = res.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downscale and compress image to max 1200px dimension at 0.8 JPEG quality.
 * Shrinks 5MB-10MB mobile sketch uploads to ~100KB-180KB, reducing base64
 * upload payload by 98% and speeding up Gemini inference by 5x-10x.
 */
async function optimizeImageForGemini(url: string, maxDim = 1200, quality = 0.8): Promise<{ mimeType: string; data: string } | null> {
  try {
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      return { mimeType, data: parts[1] };
    }

    // Try canvas downscaling first if in browser environment
    if (typeof window !== "undefined" && typeof Image !== "undefined") {
      try {
        const compressed = await new Promise<{ mimeType: string; data: string } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const timer = setTimeout(() => resolve(null), 3500); // 3.5s timeout guard

          img.onload = () => {
            clearTimeout(timer);
            try {
              let { width, height } = img;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(null);
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL("image/jpeg", quality);
              const base64Data = dataUrl.split(",")[1] || "";
              resolve({ mimeType: "image/jpeg", data: base64Data });
            } catch {
              resolve(null);
            }
          };

          img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
          };

          img.src = url;
        });

        if (compressed) return compressed;
      } catch (canvasErr) {
        console.warn("Canvas compression skipped, using fast blob:", canvasErr);
      }
    }

    // High-performance direct fetch fallback
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const base64 = await blobToBase64(blob);
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
    "Ground your concept in real ergonomic dimensions and sharpen perspective convergence.",
    "Eliminate cliché solutions; push for deeper user pain points and crisp tonal contrast.",
    "Prioritize functional proportion and articulate mechanism details over superficial styling."
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

  // Add system instruction / prompt with strict, rigorous national exam standards
  const systemPrompt = `You are an elite, notoriously rigorous chief design jury evaluator for premier national design institutes (NID, CEED, UCEED).
You are evaluating a student's subjective design & sketching submission for Part B.

EXAM QUESTION:
${questionText.replace(/<[^>]*>/g, " ")}

STRICT GRADING PHILOSOPHY & CALIBRATION (Total Max Marks: ${maxMarks}, Max ${maxPerCriteria} per criteria):
- Premier national design entrance exams have uncompromising standards. Do NOT award lenient or inflated marks.
- Full or high marks (75%+ of criteria) are reserved STRICTLY for exceptional, portfolio-grade work exhibiting lateral breakthrough thinking and masterclass perspective/craft.
- Typical or surface-level attempts that lack user context, human figures for scale, or rigorous perspective must be marked strictly in the 30% to 50% range.
- Heavily penalize: generic/cliché ideas, floating objects without scale, inaccurate vanishing points, muddy linework, and unfeasible styling without usability logic.
- Rubric criteria:
  1. Critical Thinking: Root problem grasp, real user pain points, unstated constraints.
  2. Ideation: Genuine novelty, divergence from obvious first ideas, depth.
  3. Storytelling: Contextual empathy, interaction sequence, clear narrative.
  4. Conceptualisation: Ergonomics, functional feasibility, structural logic.
  5. Representation: Line weight hierarchy, correct perspective, proportions, tonal contrast.

CRITIQUE & REALITY-CHECK INSTRUCTIONS ('mentor_comments'):
- Deliver an honest, uncompromising reality-check critique that clearly pinpoints the exact flaw preventing this from reaching top-rank caliber.
- Balance the hard reality check with sharp, actionable, and forward-looking guidance that drives the student to elevate their craft rather than demotivating them.
- Avoid hollow praise or sugarcoating (e.g. NEVER say "good effort", "nice attempt"). Speak like an authentic design mentor.
- WORD COUNT REQUIREMENT: Write strictly between 20 and 25 words in length. Count your words meticulously.

ACTIONABLE REMEDIATION ('mentor_improvements'):
- In 'mentor_improvements', provide exactly one concise, high-impact tactical advice sentence (10-15 words).`;

  contentParts.push({ text: systemPrompt });

  // Attach reference image if question has one (optimized & downscaled)
  if (questionMediaUrl) {
    const refImg = await optimizeImageForGemini(questionMediaUrl);
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

  // Attach student sketch submission if available (parallel downscaling & fetching)
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

    const urlsToFetch = rawUrls.slice(0, 3);
    const optimizedSketches = await Promise.all(
      urlsToFetch.map(u => optimizeImageForGemini(u))
    );

    optimizedSketches.forEach((sketchImg, i) => {
      if (sketchImg) {
        contentParts.push({ text: `[Student Submission Sketch Page ${i + 1}]:` });
        contentParts.push({
          inlineData: {
            mimeType: sketchImg.mimeType,
            data: sketchImg.data
          }
        });
      }
    });
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
      maxOutputTokens: 1024,
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

  // Clamp and format rubric values strictly to 2 decimal places and min 0
  const clampScore = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(maxPerCriteria, Math.round(num * 100) / 100));
  };

  const critical_thinking = clampScore(parsed.critical_thinking);
  const ideation = clampScore(parsed.ideation);
  const storytelling = clampScore(parsed.storytelling);
  const conceptualisation = clampScore(parsed.conceptualisation);
  const representation = clampScore(parsed.representation);

  const totalSum = Math.max(0, Math.round((critical_thinking + ideation + storytelling + conceptualisation + representation) * 100) / 100);

  // Enforce 20-25 word constraint strictly
  const { text: validatedComments, wordCount } = adjustToWordLimit(parsed.mentor_comments || "", 20, 25);

  return {
    rubric_marks: {
      critical_thinking: critical_thinking.toFixed(2).replace(/\.?0+$/, ''),
      ideation: ideation.toFixed(2).replace(/\.?0+$/, ''),
      storytelling: storytelling.toFixed(2).replace(/\.?0+$/, ''),
      conceptualisation: conceptualisation.toFixed(2).replace(/\.?0+$/, ''),
      representation: representation.toFixed(2).replace(/\.?0+$/, '')
    },
    marks_awarded: totalSum,
    mentor_comments: validatedComments,
    mentor_improvements: parsed.mentor_improvements || "",
    word_count: wordCount
  };
}

/**
 * Evaluate a single Part B subjective response using OpenAI (ChatGPT / GPT-4o / GPT-4o-mini)
 */
export async function evaluatePartBWithOpenAI(params: {
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
  let model = params.model;

  if (!apiKey) {
    const settings = await getAISettings();
    apiKey = settings.openaiKey;
    if (!model) model = settings.openaiModel;
  }

  if (!model) model = "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured. Please add it in AI Settings.");
  }

  const maxPerCriteria = Math.round((maxMarks / 5) * 10) / 10;

  const systemPrompt = `You are an elite, notoriously rigorous chief design jury evaluator for premier national design institutes (NID, CEED, UCEED).
You are evaluating a student's subjective design & sketching submission for Part B.

EXAM QUESTION:
${questionText.replace(/<[^>]*>/g, " ")}

STRICT GRADING PHILOSOPHY & CALIBRATION (Total Max Marks: ${maxMarks}, Max ${maxPerCriteria} per criteria):
- Premier national design entrance exams have uncompromising standards. Do NOT award lenient or inflated marks.
- Full or high marks (75%+ of criteria) are reserved STRICTLY for exceptional, portfolio-grade work exhibiting lateral breakthrough thinking and masterclass perspective/craft.
- Typical or surface-level attempts that lack user context, human figures for scale, or rigorous perspective must be marked strictly in the 30% to 50% range.
- Heavily penalize: generic/cliché ideas, floating objects without scale, inaccurate vanishing points, muddy linework, and unfeasible styling without usability logic.
- Rubric criteria:
  1. Critical Thinking: Root problem grasp, real user pain points, unstated constraints.
  2. Ideation: Genuine novelty, divergence from obvious first ideas, depth.
  3. Storytelling: Contextual empathy, interaction sequence, clear narrative.
  4. Conceptualisation: Ergonomics, functional feasibility, structural logic.
  5. Representation: Line weight hierarchy, correct perspective, proportions, tonal contrast.

CRITIQUE & REALITY-CHECK INSTRUCTIONS ('mentor_comments'):
- Deliver an honest, uncompromising reality-check critique that clearly pinpoints the exact flaw preventing this from reaching top-rank caliber.
- Balance the hard reality check with sharp, actionable, and forward-looking guidance that drives the student to elevate their craft rather than demotivating them.
- Avoid hollow praise or sugarcoating (e.g. NEVER say "good effort", "nice attempt"). Speak like an authentic design mentor.
- WORD COUNT REQUIREMENT: Write strictly between 20 and 25 words in length. Count your words meticulously.

ACTIONABLE REMEDIATION ('mentor_improvements'):
- In 'mentor_improvements', provide exactly one concise, high-impact tactical advice sentence (10-15 words).

OUTPUT FORMAT:
Return a strictly valid JSON object with EXACTLY these keys:
{
  "critical_thinking": number (0 to ${maxPerCriteria}),
  "ideation": number (0 to ${maxPerCriteria}),
  "storytelling": number (0 to ${maxPerCriteria}),
  "conceptualisation": number (0 to ${maxPerCriteria}),
  "representation": number (0 to ${maxPerCriteria}),
  "mentor_comments": string (strictly 20-25 words),
  "mentor_improvements": string (10-15 words)
}`;

  const userContent: any[] = [];
  userContent.push({
    type: "text",
    text: `Please evaluate this student submission strictly according to the exam rubric.`
  });

  if (questionMediaUrl) {
    const refImg = await optimizeImageForGemini(questionMediaUrl);
    if (refImg) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${refImg.mimeType};base64,${refImg.data}`,
          detail: "low"
        }
      });
    }
  }

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

    const urlsToFetch = rawUrls.slice(0, 3);
    const optimizedSketches = await Promise.all(
      urlsToFetch.map(u => optimizeImageForGemini(u))
    );

    optimizedSketches.forEach((sketchImg, i) => {
      if (sketchImg) {
        userContent.push({
          type: "text",
          text: `[Student Submission Sketch Page ${i + 1}]:`
        });
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:${sketchImg.mimeType};base64,${sketchImg.data}`,
            detail: "high"
          }
        });
      }
    });
  }

  if (candidateAnswerText && candidateAnswerText.trim()) {
    userContent.push({
      type: "text",
      text: `[Student Written Explanation / Concept Note]:\n${candidateAnswerText}`
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
  }

  const resData = await response.json();
  const rawText = resData.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error("No evaluation response received from OpenAI.");
  }

  const parsed = JSON.parse(rawText);

  const clampScore = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(maxPerCriteria, Math.round(num * 100) / 100));
  };

  const critical_thinking = clampScore(parsed.critical_thinking);
  const ideation = clampScore(parsed.ideation);
  const storytelling = clampScore(parsed.storytelling);
  const conceptualisation = clampScore(parsed.conceptualisation);
  const representation = clampScore(parsed.representation);

  const totalSum = Math.max(0, Math.round((critical_thinking + ideation + storytelling + conceptualisation + representation) * 100) / 100);

  const { text: validatedComments, wordCount } = adjustToWordLimit(parsed.mentor_comments || "", 20, 25);

  return {
    rubric_marks: {
      critical_thinking: critical_thinking.toFixed(2).replace(/\.?0+$/, ''),
      ideation: ideation.toFixed(2).replace(/\.?0+$/, ''),
      storytelling: storytelling.toFixed(2).replace(/\.?0+$/, ''),
      conceptualisation: conceptualisation.toFixed(2).replace(/\.?0+$/, ''),
      representation: representation.toFixed(2).replace(/\.?0+$/, '')
    },
    marks_awarded: totalSum,
    mentor_comments: validatedComments,
    mentor_improvements: parsed.mentor_improvements || "",
    word_count: wordCount
  };
}

/**
 * Unified Part B Evaluator: Automatically routes to OpenAI (ChatGPT) or Gemini based on active configuration
 */
export async function evaluatePartBWithAI(params: {
  questionText: string;
  questionMediaUrl?: string | null;
  candidateFileUrl?: string | null;
  candidateAnswerText?: string | null;
  maxMarks: number;
}): Promise<EvaluationResult> {
  const settings = await getAISettings();

  // Prefer OpenAI if configured or selected as provider
  if (settings.provider === "openai" || (!settings.geminiKey && settings.openaiKey)) {
    if (!settings.openaiKey) {
      throw new Error("OpenAI API key is missing. Please add your ChatGPT/OpenAI API key in AI Settings.");
    }
    return evaluatePartBWithOpenAI({
      ...params,
      apiKey: settings.openaiKey,
      model: settings.openaiModel
    });
  }

  // Fallback to Gemini if configured
  if (settings.geminiKey) {
    return evaluatePartBWithGemini({
      ...params,
      apiKey: settings.geminiKey,
      model: settings.geminiModel
    });
  }

  // If OpenAI key is present even if provider wasn't explicitly switched
  if (settings.openaiKey) {
    return evaluatePartBWithOpenAI({
      ...params,
      apiKey: settings.openaiKey,
      model: settings.openaiModel
    });
  }

  throw new Error("No AI API key found. Please configure OpenAI (ChatGPT) or Gemini in AI Settings.");
}
