export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Function-Active': 'true'
  };

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Health/info for GET
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      ok: true,
      message: 'WBC Training chat endpoint. POST JSON {"message":"..."} to chat with Gemini.'
    }), { status: 200, headers });
  }

  // Accept only POST for chat payload
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      ok: false,
      response: `Method ${request.method} not supported; use POST`
    }), { status: 200, headers });
  }

  // Parse JSON
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({
      response: 'Error: Invalid JSON request'
    }), { status: 400, headers });
  }

  if (!body || !body.message) {
    return new Response(JSON.stringify({
      response: 'Error: Message parameter is required'
    }), { status: 400, headers });
  }

  const userMessage = body.message.trim();
  if (!userMessage) {
    return new Response(JSON.stringify({
      response: 'Error: Message cannot be empty'
    }), { status: 400, headers });
  }

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
