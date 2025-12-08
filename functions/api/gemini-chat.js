export async function onRequestPost(context) {
  const { request, env } = context;

  const body = await request.json();
  const userMessage = body.message || "";

  const geminiEndpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

  const prompt = `
You are the AI Concierge for WBC Training. 
Answer helpfully and concisely.

User: ${userMessage}
  `;

  const response = await fetch(`${geminiEndpoint}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  const json = await response.json();

  const reply =
    json.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") ||
    "Sorry, I could not reply.";

  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" }
  });
}
export async function onRequestPost({ request, env }) {

  // Get Gemini API key from Pages environment
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      response: 'Chat service is temporarily unavailable. Please set GEMINI_API_KEY Pages secret.'
    }), { status: 200, headers });
  }

  // Call Gemini API
  try {
    const systemPrompt = `You are an AI concierge for WBC Training, a business capability training company.
You help with:
- Course information and schedules
- Booking availability
- Pricing and fees
- Location and travel directions
- Training programme details

Be helpful, professional, and concise. If you don't know something, suggest contacting info@wbctraining.com or calling +44 7540 269 827.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${userMessage}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({
          response: 'Authentication failed. Please verify GEMINI_API_KEY Pages secret is valid.'
        }), { status: 200, headers });
      }
      
      return new Response(JSON.stringify({
        response: 'Error: Unable to reach chat service. Please try again later.'
      }), { status: 200, headers });
    }

    const data = await response.json();

    // Extract text from Gemini response
    let botResponse = 'Sorry, I could not generate a response. Please try again.';
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        botResponse = candidate.content.parts[0].text;
      }
    }

    return new Response(JSON.stringify({
      response: botResponse
    }), { status: 200, headers });

  } catch (err) {
    console.error('Chat error:', err);
    return new Response(JSON.stringify({
      response: 'Error: Chat service encountered an issue. Please try again later.'
    }), { status: 200, headers });
  }
}
