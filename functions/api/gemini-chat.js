// Cloudflare Pages Function: POST /api/gemini-chat
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // ---- 1) Read request body safely ----
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", detail: String(e) }),
      { status: 400, headers }
    );
  }

  const userMessage = (body.message || "").toString().trim();
  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: "Missing `message` in request body" }),
      { status: 400, headers }
    );
  }

  // ---- 2) Check API key ----
  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not set in environment" }),
      { status: 500, headers }
    );
  }

  // ---- 3) Call Gemini (catch network errors) ----
  const geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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

  let geminiRes;
  try {
    geminiRes = await fetch(
      `${geminiUrl}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
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
  } catch (e) {
    // Could not reach Google at all
    return new Response(
      JSON.stringify({
        error: "Failed to reach Gemini API",
        detail: String(e),
      }),
      { status: 502, headers }
    );
  }

  const text = await geminiRes.text();

  // ---- 4) Parse JSON (or return raw error) ----
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    if (!geminiRes.ok) {
      // Gemini returned a non-JSON error body (rare but possible)
      return new Response(
        JSON.stringify({
          error: "Gemini API error (non-JSON response)",
          status: geminiRes.status,
          detail: text,
        }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to parse Gemini JSON",
        status: geminiRes.status,
        detail: text,
      }),
      { status: 500, headers }
    );
  }

  // ---- 5) Handle Gemini error JSON ----
  if (!geminiRes.ok) {
    const message =
      (json && json.error && json.error.message) || JSON.stringify(json);

    return new Response(
      JSON.stringify({
        error: "Gemini API error",
        status: geminiRes.status,
        detail: message,
      }),
      { status: 502, headers }
    );
  }

  // ---- 6) Normal success path ----
  const candidates = json.candidates || [];
  const first = candidates[0] || {};
  const parts = (first.content && first.content.parts) || [];
  const reply =
    parts.map((p) => p.text || "").join(" ").trim() ||
    "Sorry, I could not generate a response right now.";

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers,
  });
}

// Handle OPTIONS preflight (good practice)
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




