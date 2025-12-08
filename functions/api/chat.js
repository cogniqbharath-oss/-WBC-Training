// Cloudflare Pages Function
// URL: /api/chat
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ reply: "No message provided." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ reply: "GEMINI API key missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

    const geminiResponse = await fetch(
      `${geminiUrl}?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
        }),
      }
    );

    const geminiJson = await geminiResponse.json();

    const reply =
      geminiJson.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join(" ") ||
      "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply:

