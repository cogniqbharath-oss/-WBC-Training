// Cloudflare Pages Function: POST /api/gemini-chat
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body = await request.json().catch(() => ({}));
    const userMessage = (body.message || "").toString().trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "Missing `message` in request body" }),
        { status: 400, headers }
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set in environment" }),
        { status: 500, headers }
      );
    }

    const geminiEndpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

    const prompt = `
You are the AI Concierge for WBC Training.

Answer clearly and helpfully about:
- Online & classroom courses
- Online workshops
- In-house training
- Premium offerings and flagship programmes

If asked about bookings, remind users they can email info@wbctraining.com or call +44 7540 269 827.

User: ${userMessage}
    `.trim();

    const geminiRes = await fetch(
      `${geminiEndpoint}?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const text = await geminiRes.text();

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Gemini API error",
          status: geminiRes.status,
          detail: text,
        }),
        { status: 502, headers }
      );
    }

    let geminiJson;
    try {
      geminiJson = JSON.parse(text);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Failed to parse Gemini JSON",
          detail: text,
        }),
        { status: 500, headers }
      );
    }

    const candidates = geminiJson.candidates || [];
    const first = candidates[0] || {};
    const parts = (first.content && first.content.parts) || [];
    const replyText =
      parts.map((p) => p.text || "").join(" ").trim() ||
      "Sorry, I could not generate a response right now.";

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error in /api/gemini-chat",
        detail: String(err),
      }),
      { status: 500, headers }
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

