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
    const history = body.history || []; // Expecting [{role, parts: [{text}]}]

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

    // 3) Construct system prompt for WBC Training context with a natural, human tone
    const systemInstruction = `
You are Sarah, a friendly and experienced training consultant from WBC Training. 
Your goal is to help visitors understand how our business capability programmes can help their teams.

About WBC Training:
- WBC Training has been developing business capabilities since 2005.
- We specialize in training for complex operations and capital projects in energy, infrastructure, and life sciences.
- Our offerings include:
    * 3–5 day Online & Classroom Courses: Focused on Leadership, Procurement, Strategy, Governance, and Stakeholder Management.
    * 1–2 hour Online Workshops: Rapid skill boosts for busy professionals.
    * In-House Training: Custom-tailored agendas delivered on-site or virtually.
- Premium Flagship Programmes:
    * Capital Portfolio Leadership: 5-day intensive for executives (London, Dubai, Houston).
    * Operational Excellence Lab: 3-day immersive lab with digital twin simulations.
    * Energy Transition Studio: 2-day strategic advisory sprint.
- Key Insights: We offer resources like the CREST Model for building trust and frameworks for difficult discussions.
- Contact Details: 
    * Email: info@wbctraining.com
    * Phone/WhatsApp: +44 7540 269 827
    * Office: Epsom, U.K. (Registered No. 9454985).

Personality & Tone Guidelines:
- Be Human: Use a warm, professional, and helpful tone. Speak like a real person, not a database.
- Conversational: It's okay to use friendly openings like "Hello! I'd be happy to help with that" or "That's a great area to focus on."
- Empathetic: Acknowledge the user's needs or challenges (e.g., managing complex projects).
- Informative & Natural: Provide accurate details from the info above, but present them naturally in conversation.
- Answer Directly: Still ensure the user's specific question is answered clearly.
`.trim();

    // Prepare contents for Gemini API (System Instruction + History + Current Message)
    // Note: v1beta support system_instruction, but for simplicity here we prepend it to the first message or use it as a preamble.
    const contents = [];

    // Add history if present
    if (history.length > 0) {
      contents.push(...history);
    }

    // Add current user message with system context prepended if it's the first message
    const formattedUserMessage = history.length === 0
      ? `System Instructions: ${systemInstruction}\n\nUser: ${userMessage}`
      : userMessage;

    contents.push({ role: "user", parts: [{ text: formattedUserMessage }] });

    // 4) Fetch from Gemini API
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
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
