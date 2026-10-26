import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { attemptId } = await req.json();
    if (!attemptId) {
      throw new Error("attemptId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const fallbackAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey || fallbackAnonKey);

    // 1. Fetch Gemini API configuration from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value");

    const geminiKey = Deno.env.get("GEMINI_API_KEY") || settings?.find((d: any) => d.key === "gemini_api_key")?.value;
    let geminiModel = settings?.find((d: any) => d.key === "gemini_api_model")?.value || "gemini-flash-latest";

    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key is not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2. Fetch attempt, test, and candidate responses
    const { data: attempt, error: attErr } = await supabase
      .from("exam_attempts")
      .select("*, exam_tests(*)")
      .eq("id", attemptId)
      .single();

    if (attErr || !attempt) throw new Error("Attempt not found");

    const { data: responses, error: respErr } = await supabase
      .from("exam_responses")
      .select("*, exam_questions(*)")
      .eq("attempt_id", attemptId);

    if (respErr || !responses) throw new Error("Responses not found");

    const partBResponses = responses.filter((r: any) => 
      r.exam_questions?.part === "B" || r.file_url !== null || r.answer_text !== null
    );

    let totalScoreB = 0;

    const results = await Promise.allSettled(
      partBResponses.map(async (resp: any) => {
        const q = resp.exam_questions;
        if (!q) return 0;

        const maxMarks = q.marks || 50;
        const maxPerCriteria = Math.round((maxMarks / 5) * 10) / 10;

        const contentParts: any[] = [
          {
            text: `You are an esteemed Senior Professor and Design Mentor with 30+ years of studio teaching and jury experience at India's premier design institutes (NID Ahmedabad and IIT Bombay IDC).
You are reviewing a candidate's subjective design and sketch submission for Part B of national entrance exams (NID DAT / CEED / UCEED).

QUESTION:
${q.content_text || ""}
MAX MARKS: ${maxMarks} (Max ${maxPerCriteria} per criteria)

EVALUATION PRINCIPLES:
1. TALK LIKE A REAL HUMAN MENTOR:
   - Speak in simple, clear, conversational human English—the way you would speak to a student at their drafting table in a studio critique.
   - Warm, observant, encouraging, yet honest about flaws.
   - NEVER use generic AI buzzwords or cliché fillers (NEVER say "delve", "testament", "tapestry", "blend of", "good effort", "nice attempt", "commendable", "it is imperative").
2. DO JUSTICE TO THIS SPECIFIC SUBMISSION:
   - Look closely at what the student has actually drawn and written.
   - You MUST explicitly reference 1 or 2 specific visual or functional details from their actual submission (e.g., the exact object form, the angle of perspective, a specific handle or hinge, the scale human figure, line weight contrast, cross-hatching, or specific annotations).
   - Never write a generic critique that could apply to any random drawing.
3. SCORING CRITERIA (0.0 to ${maxPerCriteria} each, evaluate independently without giving uniform scores):
   1. Critical Thinking: Root problem grasp, real user pain points, unstated constraints.
   2. Ideation: Genuine novelty, divergence from obvious first ideas.
   3. Storytelling: Contextual empathy, interaction sequence, clear narrative.
   4. Conceptualisation: Ergonomics, functional feasibility, structural logic.
   5. Representation: Line weight hierarchy, correct perspective, proportions, tonal contrast.

MENTOR FEEDBACK REQUIREMENTS:
- 'mentor_comments': 2 to 3 natural, observant sentences (approx 30 to 55 words) addressed directly to the student ("you"). Mention what works in their specific concept, and pinpoint the exact functional or visual flaw that holds it back.
- 'mentor_improvements': One actionable studio exercise or technique tip (15 to 25 words).`
          }
        ];

        if (resp.file_url) {
          try {
            let urls: string[] = [];
            if (resp.file_url.startsWith("[")) {
              urls = JSON.parse(resp.file_url);
            } else {
              urls = [resp.file_url];
            }
            for (let idx = 0; idx < Math.min(urls.length, 2); idx++) {
              const imgRes = await fetch(urls[idx]);
              if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = "";
                for (let b = 0; b < bytes.byteLength; b++) {
                  binary += String.fromCharCode(bytes[b]);
                }
                const b64 = btoa(binary);
                contentParts.push({
                  text: `[Candidate Submission Sketch Page ${idx + 1}]:`
                });
                contentParts.push({
                  inlineData: {
                    mimeType: imgRes.headers.get("content-type") || "image/jpeg",
                    data: b64
                  }
                });
              }
            }
          } catch (e) {
            console.warn("Could not attach candidate image in Edge Function:", e);
          }
        }

        if (resp.answer_text) {
          contentParts.push({ text: `Student Concept Explanation:\n${resp.answer_text}` });
        }

        const responseSchema = {
          type: "OBJECT",
          properties: {
            critical_thinking: { type: "NUMBER" },
            ideation: { type: "NUMBER" },
            storytelling: { type: "NUMBER" },
            conceptualisation: { type: "NUMBER" },
            representation: { type: "NUMBER" },
            mentor_comments: { type: "STRING" },
            mentor_improvements: { type: "STRING" }
          },
          required: ["critical_thinking", "ideation", "storytelling", "conceptualisation", "representation", "mentor_comments"]
        };

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: contentParts }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
                responseSchema
              }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const evalResult = JSON.parse(rawText);
            const ct = Math.min(maxPerCriteria, Math.max(0, Number(evalResult.critical_thinking) || 0));
            const id = Math.min(maxPerCriteria, Math.max(0, Number(evalResult.ideation) || 0));
            const st = Math.min(maxPerCriteria, Math.max(0, Number(evalResult.storytelling) || 0));
            const co = Math.min(maxPerCriteria, Math.max(0, Number(evalResult.conceptualisation) || 0));
            const re = Math.min(maxPerCriteria, Math.max(0, Number(evalResult.representation) || 0));
            const qScore = Math.max(0, Math.round((ct + id + st + co + re) * 100) / 100);

            // Clean comment without artificial truncate
            let comment = (evalResult.mentor_comments || "").trim();
            const words = comment.split(/\s+/).filter(Boolean);
            if (words.length > 75) {
              comment = words.slice(0, 75).join(" ") + ".";
            }

            await supabase.from("exam_responses").update({
              marks_awarded: qScore,
              rubric_marks: {
                critical_thinking: ct.toString(),
                ideation: id.toString(),
                storytelling: st.toString(),
                conceptualisation: co.toString(),
                representation: re.toString()
              },
              mentor_comments: comment,
              mentor_improvements: evalResult.mentor_improvements || null,
              ai_evaluated: true
            }).eq("id", resp.id);

            return qScore;
          }
        }
        return 0;
      })
    );

    for (const res of results) {
      if (res.status === "fulfilled") {
        totalScoreB += res.value;
      }
    }

    // Update attempt
    const totalScore = (attempt.score_part_a || 0) + totalScoreB;
    await supabase.from("exam_attempts").update({
      score_part_b: totalScoreB,
      total_score: totalScore,
      part_b_evaluation_status: "completed",
      part_b_evaluated_at: new Date().toISOString()
    }).eq("id", attemptId);

    return new Response(JSON.stringify({ success: true, scorePartB: totalScoreB, totalScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("evaluate-part-b error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
