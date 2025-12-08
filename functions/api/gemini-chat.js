// Cloudflare Pages Function: /api/gemini-chat

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ response: 'Method not allowed. Use POST.' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const userMessage = String(body.message || '').trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ response: 'Error: Missing message' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ response: 'Error: GEMINI_API_KEY not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const geminiEndpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

    const prompt = `
You are the AI Concierge for WBC Training, a company that delivers leadership, governance,
and operational excellence training for energy, infrastructure, and life-science sectors.

Answer clearly and helpfully, and where relevant point to:
- "Online & Classroom Courses"
- "Online Workshops"
- "In-House Training"
- "Premium offerings and flagship programmes"

If asked about bookings, remind users they can email info@wbctraining.com or call +44 7540 269 827.

User: ${userMessage}
    `.trim();

    const geminiRes = await fetch(`${geminiEndpoint}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, text);
      return new Response(
        JSON.stringify({ response: 'Error: Unable to reach chat service. Please try again later.' }),
        { status: 200, headers: corsHeaders }
      );
    }

    const geminiJson = await geminiRes.json();
    const candidates = geminiJson.candidates || [];
    const first = candidates[0] || {};
    const parts = (first.content && first.content.parts) || [];
    const replyText =
      parts.map((p) => p.text || '').join(' ').trim() ||
      'Sorry, I could not generate a response right now.';

    return new Response(
      JSON.stringify({ response: replyText }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Worker error:', err);
    return new Response(
      JSON.stringify({ response: 'Error: Chat service encountered an issue.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
