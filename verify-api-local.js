// Use native fetch (available in Node.js 18+)
async function test() {
    const GEMINI_API_KEY = "AIzaSyDLB0DSZFHaEUCYnEYAaDQHxqXzpMLHKYs";
    const model = "gemini-1.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    console.log("Testing URL (redacted):", geminiUrl.replace(GEMINI_API_KEY, "REDACTED"));

    try {
        const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "hi" }] }],
            }),
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
