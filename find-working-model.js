async function testModel(model) {
    const GEMINI_API_KEY = "AIzaSyBvJGDQ0kUCPqzF1MOX4Sho1KpiTKbB3-k";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`Testing model: ${model}`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "hi" }] }],
            }),
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            console.log(`SUCCESS! Reply: ${data.candidates[0].content.parts[0].text}`);
            return true;
        } else {
            console.log(`FAIL: ${data.error.message}`);
            return false;
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
        return false;
    }
}

async function run() {
    const models = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-pro"];
    for (const m of models) {
        if (await testModel(m)) break;
    }
}

run();
