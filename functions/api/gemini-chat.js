// Cloudflare Pages Function: POST /api/gemini-chat
export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    // Read JSON body
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userMessage = String(body.message || "").trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "Missing `message` in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!env.GEMINI_API_KEY) {
      // This is the most common cause of 500s
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set in Cloudflare environment" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Gemini API call
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

    const rawText = await geminiRes.text();

    if (!geminiRes.ok) {
      // Bubble Gemini’s error back instead of a generic 500
      return new Response(
        JSON.stringify({ error: "Gemini API error", detail: rawText }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let geminiJson;
    try {
      geminiJson = JSON.parse(rawText);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemini response", detail: rawText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const candidates = geminiJson.candidates || [];
    const first = candidates[0] || {};
    const parts = (first.content && first.content.parts) || [];
    const replyText =
      parts.map((p) => p.text || "").join(" ").trim() ||
      "Sorry, I could not generate a response right now.";

    return new Response(
      JSON.stringify({ reply: replyText }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    // Catch any unexpected errors
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

// Optional: handle OPTIONS preflight (good practice)
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
