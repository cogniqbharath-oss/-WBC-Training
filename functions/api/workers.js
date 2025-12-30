/**
 * Cloudflare Worker: https://summer-firefly-ae50.cogniq-bharath.workers.dev/
 * Standard Worker for WBC Training Chatbot
 * Handles Persona: Sarah, Chat History, and Multiple Input Formats
 */

export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // 1) Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // 2) Allow only POST
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method Not Allowed. Please use POST." }), {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        try {
            const body = await request.json();

            // Accept both 'message' and 'prompt' for compatibility
            const userMessage = (body.message || body.prompt || "").toString().trim();
            const history = body.history || [];

            if (!userMessage) {
                return new Response(JSON.stringify({
                    error: "No message provided. Please include 'message' or 'prompt' in your request."
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // 3) Securely check API key
            if (!env.GEMINI_API_KEY) {
                return new Response(JSON.stringify({
                    error: "API Key missing in Worker environment variables."
                }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // 4) Model Configuration
            const modelName = env.GEMINI_MODEL || "gemini-1.5-flash";
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

            // 5) Sarah Persona
            const systemInstruction = `
You are Sarah, a friendly and experienced training consultant from WBC Training. 
Your goal is to help visitors understand how our business capability programmes can help their teams.

About WBC Training:
- WBC Training has been developing business capabilities since 2005.
- We specialize in training for complex operations and capital projects.
- Our offerings: 3–5 day courses (Leadership, Procurement, Strategy), 1-2 hour workshops, and In-House Training.
- Flagship Programs: Capital Portfolio Leadership, Operational Excellence Lab, Energy Transition Studio.
- Contact: info@wbctraining.com | Phone/WhatsApp: +44 7540 269 827 | Office: Epsom, U.K.

Tone: Human, Warm, Conversational, and Professional.
`.trim();

            const contents = [];

            // Prepend system instruction for the very first message
            const finalMessage = history.length === 0
                ? `System Instruction: ${systemInstruction}\n\nUser: ${userMessage}`
                : userMessage;

            if (history.length > 0) {
                contents.push(...history);
            }
            contents.push({ role: "user", parts: [{ text: finalMessage }] });

            // 6) Call Gemini API
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
                const errorMessage = data?.error?.message || "API Error";
                return new Response(JSON.stringify({
                    reply: `Service error: ${errorMessage}`,
                    error: errorMessage
                }), {
                    status: response.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I'm having trouble thinking of a response. Please try again.";

            return new Response(JSON.stringify({
                reply: botReply,
                response: botReply,
                model: modelName
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: "Worker Error",
                message: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }
};
