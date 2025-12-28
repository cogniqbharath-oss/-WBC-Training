// Cloudflare Pages Function: POST /api/gemini-chat
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // 1) Securely check API key
  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not set in Cloudflare secrets." }),
      { status: 200, headers }
    );
  }

  try {
    const body = await request.json();
    const userMessage = (body.message || "").toString().trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "Missing message in request body" }),
        { status: 200, headers }
      );
    }

    // 2) Construct Gemini API URL
    const model = env.GEMINI_MODEL || "gemini-2.0-flash";
    const modelName = model.startsWith("models/") ? model.split("/")[1] : model;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

    // 3) Construct system prompt for WBC Training context with a human-like tone
    const prompt = `
You are a friendly and helpful AI Concierge at WBC Training (Business Capability Programmes). 
Your goal is to assist users in a warm, natural, and human-like way.

About WBC Training:
- Established in 2005.
- Offers 3-5 day classroom/online courses in Leadership, Procurement, Strategy, Governance, and Stakeholder Management.
- Provides 1-2 hour Online Workshops for rapid skill boosts.
- Delivers custom in-house training globally (London, Dubai, Erbil).
- Contact: info@wbctraining.com or +44 7540 269 827.

Guidelines:
- Be warm and conversational.
- Use natural transitions like "That's a great question!"
- If unsure, suggest emailing info@wbctraining.com.

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
        JSON.stringify({
          reply: `AI Service Error: ${errMsg}`,
          error: errMsg
        }),
        { status: 200, headers }
      );
    }

    // 5) Extract reply
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response. Please try again or contact us.";

    // 6) Return both 'reply' and 'response' for maximum compatibility
    return new Response(
      JSON.stringify({
        reply: reply,
        response: reply
      }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        reply: "Sorry, I had trouble processing that. Please try again.",
        error: "Internal Server Error",
        detail: error.message
      }),
      { status: 200, headers }
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
