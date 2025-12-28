async function testModel(model) {
    const GEMINI_API_KEY = "AIzaSyDLB0DSZFHaEUCYnEYAaDQHxqXzpMLHKYs";
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
            console.log(`Success: ${data.candidates[0].content.parts[0].text.substring(0, 20)}...`);
        } else {
            console.log(`Error: ${data.error.message}`);
        }
    } catch (err) {
        console.error(`Fetch Error: ${err.message}`);
    }
}

async function runTests() {
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-flash-latest");
    await testModel("gemini-2.0-flash");
    await testModel("gemini-flash-latest");
}

runTests();
