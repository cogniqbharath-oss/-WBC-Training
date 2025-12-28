
async function test() {
    const GEMINI_API_KEY = "AIzaSyBvJGDQ0kUCPqzF1MOX4Sho1KpiTKbB3-k";
    const model = "gemini-2.0-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`Testing ${model} with new key...`);

    try {
        const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "Hello!" }] }],
            }),
        });

        const data = await res.json();

        if (res.ok) {
            console.log("SUCCESS! Status:", res.status);
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("Reply:", reply);
        } else {
            console.log("FAILED. Status:", res.status);
            console.log("Error:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Network Error:", err);
    }
}

test();
