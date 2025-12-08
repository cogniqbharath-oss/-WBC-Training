export async function onRequestPost({ request, env }) {
  try {
    const { message } = await request.json();

    if (!message) {
      return new Response('No message provided.', { status: 400 });
    }

    const geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

    const geminiRes = await fetch(`${geminiUrl}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: message }]
        }]
      }),
    });

    const geminiJson = await geminiRes.json();
    const reply =
      geminiJson.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join(' ') ||
      'No response from AI.';

    // STREAM response word-by-word
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const words = reply.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(word + ' '));
          await new Promise(r => setTimeout(r, 40));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (e) {
    return new Response('Server error.', { status: 500 });
  }
}
