// functions/api/gemini-chat.js  (for Cloudflare Pages Functions)
// or worker.js for a standalone worker (just adjust export syntax)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Basic CORS (adjust origin as needed)
    const corsHeaders = {
      'Access-Control-Allow-Origin': url.origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const userMessage = String(body.message || '').trim();

      if (!userMessage) {
        return new Response(
          JSON.stringify({ error: 'Missing `message`' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY not configured in environment' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // ====== Gemini API CALL ======
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
        headers: {
          'Content-Type': 'application/json',
        },
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
          JSON.stringify({ error: 'Gemini API error', detail: text }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const geminiJson = await geminiRes.json();
      // Extract text from Gemini response
      const candidates = geminiJson.candidates || [];
      const first = candidates[0] || {};
      const parts = (first.content && first.content.parts) || [];
      const replyText =
        parts.map((p) => p.text || '').join(' ').trim() ||
        'Sorry, I could not generate a response right now.';

      // Return to frontend
      return new Response(
        JSON.stringify({ reply: replyText }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(
        JSON.stringify({ error: 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  },
};
