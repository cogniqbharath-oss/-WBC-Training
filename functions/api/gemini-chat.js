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
    const model = env.GEMINI_MODEL || "gemini-flash-latest";
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
- Key programs include Capital Portfolio Leadership (Flagship executive program) and Operational Excellence Lab (On-site simulation).
- Most cohorts report 98% faster stakeholder alignment within 6 weeks.
- Contact: info@wbctraining.com or +44 7540 269 827.

Human-Like Guidelines:
- Be warm, conversational, and approachable. Avoid overly formal or robotic language.
- Use natural transitions like "That's a great question!", "I'd be happy to help you with that," or "Certainly!"
- If a user asks about something specific like course dates or details, provide the information helpfully and offer further assistance.
- If you're unsure about a specific detail, suggest they reach out to our team at info@wbctraining.com—mentioning that a real human will get back to them quickly.
- Acknowledge the user's situation. For example, "It sounds like you're looking to boost your team's performance; our 3-5 day leadership courses are excellent for that."

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
