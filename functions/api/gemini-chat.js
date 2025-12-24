// Cloudflare Pages Function: POST /api/gemini-chat
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // 1) Securely check API key
  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not set in Cloudflare" }),
      { status: 500, headers }
    );
  }

  try {
    const body = await request.json();
    const userMessage = (body.message || "").toString().trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "Missing message in request body" }),
        { status: 400, headers }
      );
    }

    // 2) Select working model (gemini-flash-latest is confirmed for this key)
    const model = env.GEMINI_MODEL || "gemini-flash-latest";
    const modelName = model.startsWith("models/") ? model.split("/")[1] : model;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

    // 3) Construct system prompt for WBC Training context
    const prompt = `
You are the AI Concierge for WBC Training. 
Guidelines: Be professional and concise.
About: 
- 3-5 day courses in Leadership, Procurement, Strategy.
- Online Workshops (1-2 hours).
- In-house Training & Premium Programs.
- Contact: info@wbctraining.com or +44 7540 269 827.
- Location: London, Dubai, Erbil.

User: ${userMessage}
    `.trim();

    // 4) Fetch from Gemini API
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const errMsg = data.error?.message || "Gemini API error";
      return new Response(
        JSON.stringify({ error: errMsg, status: geminiRes.status }),
        { status: 502, headers }
      );
    }

    // 5) Extract reply
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response. Please try again or contact us.";

    // 6) Return both 'reply' and 'response' for maximum compatibility
    return new Response(
      JSON.stringify({
        reply: reply,
        response: reply // Local serve.py and some scripts look for 'response'
      }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error", detail: error.message }),
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS preflight
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




