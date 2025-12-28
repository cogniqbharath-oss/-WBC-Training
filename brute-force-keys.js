const KEYS = [
    "AIzaSyBmO0OOHhs6FLOHzb7AmrdFsgRiXRmDcSc",
    "AIzaSyDLB0DSZFHaEUCYnEYAaDQHxqXzpMLHKYs"
];

const MODELS = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-1.5-flash-latest"
];

async function test(key, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "hi" }] }]
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`SUCCESS: Key ${key.substring(0, 8)}... Model ${model}`);
            return true;
        } else {
            console.log(`FAIL: Key ${key.substring(0, 8)}... Model ${model} -> ${data.error?.message || "Unknown error"}`);
        }
    } catch (e) {
        console.log(`ERROR: Key ${key.substring(0, 8)}... Model ${model} -> ${e.message}`);
    }
    return false;
}

async function run() {
    for (const key of KEYS) {
        for (const model of MODELS) {
            if (await test(key, model)) return;
        }
    }
}

run();
