async function listModels() {
    const GEMINI_API_KEY = "AIzaSyDLB0DSZFHaEUCYnEYAaDQHxqXzpMLHKYs";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Status:", res.status);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("Error Response:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

listModels();
