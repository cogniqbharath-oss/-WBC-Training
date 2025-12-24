export default {
    async fetch(request, env) {
        // Only allow POST
        if (request.method !== "POST") {
            return new Response("Not Found", { status: 404 });
        }

        try {
            const body = await request.json();
            const userMessage = body.message;

            if (!userMessage) {
                return new Response(
                    JSON.stringify({ error: "Message is required" }),
                    { status: 400 }
                );
            }

            const geminiResponse = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
                env.GEMINI_API_KEY,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
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

            const data = await geminiResponse.json();

            const reply =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn’t generate a response.";

            return new Response(
                JSON.stringify({ reply }),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        } catch (error) {
            return new Response(
                JSON.stringify({
                    error: "Internal Server Error",
                    details: error.message,
                }),
                { status: 500 }
            );
        }
    },
};
