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

    for (const resp of partBResponses) {
      const q = resp.exam_questions;
      if (!q) continue;

      const maxMarks = q.marks || 50;
      const maxPerCriteria = Math.round((maxMarks / 5) * 10) / 10;

      const contentParts: any[] = [
        {
          text: `You are a design examiner evaluating student's Part B answer.
QUESTION: ${q.content_text || ""}
MAX MARKS: ${maxMarks}

Rate each of the 5 criteria from 0.0 to ${maxPerCriteria}:
1. Critical Thinking
2. Ideation
3. Storytelling
4. Conceptualisation
5. Representation

MANDATORY: Write mentor_comments strictly between 20 and 25 words in length. Give actionable, sharp feedback.`
        }
      ];

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
              temperature: 0.2,
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
          const ct = Math.min(maxPerCriteria, Number(evalResult.critical_thinking) || 0);
          const id = Math.min(maxPerCriteria, Number(evalResult.ideation) || 0);
          const st = Math.min(maxPerCriteria, Number(evalResult.storytelling) || 0);
          const co = Math.min(maxPerCriteria, Number(evalResult.conceptualisation) || 0);
          const re = Math.min(maxPerCriteria, Number(evalResult.representation) || 0);
          const qScore = Math.round((ct + id + st + co + re) * 10) / 10;
          totalScoreB += qScore;

          // Enforce 20-25 word boundary
          let comment = evalResult.mentor_comments || "";
          const words = comment.trim().split(/\s+/).filter(Boolean);
          if (words.length > 25) {
            comment = words.slice(0, 24).join(" ") + ".";
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
        }
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
