import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, candidateName, testTitle, score, loginUrl } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        // You can change the sender address to match your verified domain in Resend
        from: 'Designforge <evaluations@designforge.co.in>',
        to: email,
        subject: `Your Part B Results are in: ${testTitle}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; color: #262626;">
            <h2>Evaluation Complete!</h2>
            <p>Hi ${candidateName},</p>
            <p>Your subjective answers for <strong>${testTitle}</strong> have been evaluated by a mentor.</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #166534; font-weight: bold; font-size: 16px;">Final Total Score: ${score}</p>
            </div>
            
            <p>Log in to the portal and click <strong>"Review Attempt"</strong> on your test card to see your detailed breakdown, mentor feedback, and video recording.</p>
            
            <a href="${loginUrl}" style="display: inline-block; background-color: #ff3b30; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">View Full Results</a>
            
            <p style="margin-top: 40px; font-size: 12px; color: #666;">- The Designforge Team</p>
          </div>
        `
      })
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
