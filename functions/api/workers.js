/**
 * Cloudflare Worker: https://summer-firefly-ae50.cogniq-bharath.workers.dev/
 * WBC Training Chatbot - Sarah Persona
 * Returns status 200 for all responses with error details in JSON body
 */

export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // 1) Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        // 2) Handle GET requests (for health checks)
        if (request.method === "GET") {
            return new Response(JSON.stringify({
                status: "online",
                message: "WBC Training Chatbot Worker is running. Send POST with JSON body."
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 3) Only process POST for chat
        if (request.method !== "POST") {
            return new Response(JSON.stringify({
                error: "Method Not Allowed",
                message: "Please use POST to send messages."
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        try {
            // Parse JSON body with error handling
            let body;
            try {
                body = await request.json();
            } catch (parseError) {
                return new Response(JSON.stringify({
                    error: "Invalid JSON",
                    message: "Request body must be valid JSON.",
                    detail: parseError.message
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Accept both 'message' and 'prompt' for compatibility
            const userMessage = (body.message || body.prompt || "").toString().trim();
            const history = body.history || [];

            if (!userMessage) {
                return new Response(JSON.stringify({
                    error: "No message provided",
                    message: "Please include 'message' or 'prompt' in your request body."
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Check API key
            if (!env.GEMINI_API_KEY) {
                return new Response(JSON.stringify({
                    error: "Configuration Error",
                    message: "GEMINI_API_KEY is not set in Worker environment."
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Model Configuration
            const modelName = env.GEMINI_MODEL || "gemma-2-9b-it";
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

            // Sarah Persona
            const systemInstruction = `
You are Sarah, a friendly and experienced training consultant from WBC Training. 
Your goal is to help visitors understand how our business capability programmes can help their teams.

About WBC Training:
- WBC Training has been developing business capabilities since 2005.
- We specialize in training for complex operations and capital projects in energy, infrastructure, and life sciences.
- Our offerings include:
    * 3–5 day Online & Classroom Courses: Leadership, Procurement, Strategy, Governance, Stakeholder Management.
    * 1–2 hour Online Workshops: Rapid skill boosts for busy professionals.
    * In-House Training: Custom-tailored agendas delivered on-site or virtually.
- Premium Flagship Programmes:
    * Capital Portfolio Leadership: 5-day intensive for executives (London, Dubai, Houston).
    * Operational Excellence Lab: 3-day immersive lab with digital twin simulations.
    * Energy Transition Studio: 2-day strategic advisory sprint.
- Contact: info@wbctraining.com | Phone/WhatsApp: +44 7540 269 827 | Office: Epsom, U.K.

Personality & Tone Guidelines:
- Be Human: Use a warm, professional, and helpful tone. Speak like a real person, not a database.
- Conversational: It's okay to use friendly openings like "Hello! I'd be happy to help with that."
- Empathetic: Acknowledge the user's needs or challenges.
- Informative & Natural: Provide accurate details naturally in conversation.
- Answer Directly: Ensure the user's specific question is answered clearly.
`.trim();

            const contents = [];

            // Prepend system instruction for the first message
            const finalMessage = history.length === 0
                ? `System Instruction: ${systemInstruction}\n\nUser: ${userMessage}`
                : userMessage;

            if (history.length > 0) {
                contents.push(...history);
            }
            contents.push({ role: "user", parts: [{ text: finalMessage }] });

            // Call Gemini API
            const response = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data?.error?.message || "Gemini API Error";
                return new Response(JSON.stringify({
                    reply: `I'm having trouble connecting to my AI brain. Error: ${errorMessage}`,
                    error: errorMessage,
                    status: "error"
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "I apologize, I'm having trouble thinking of a response. Please try again.";

            return new Response(JSON.stringify({
                reply: botReply,
                response: botReply,
                model: modelName,
                status: "success"
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: "Worker Error",
                message: error.message,
                reply: "Sorry, I encountered an internal error. Please try again.",
                status: "error"
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }
};
