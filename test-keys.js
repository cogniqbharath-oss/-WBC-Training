async function testModel(key) {
    const model = "gemini-1.5-flash"; // Use this as it's the common generic name
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    console.log(`Testing key: ${key.substring(0, 10)}...`);
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
            console.log(`Success: ${data.candidates[0].content.parts[0].text.substring(0, 50)}...`);
        } else {
            console.log(`Error: ${data.error.message}`);
        }
    } catch (err) {
        console.error(`Fetch Error: ${err.message}`);
    }
}

async function runTests() {
    await testModel("AIzaSyBmO0OOHhs6FLOHzb7AmrdFsgRiXRmDcSc");
    await testModel("AIzaSyDLB0DSZFHaEUCYnEYAaDQHxqXzpMLHKYs");
}

runTests();
