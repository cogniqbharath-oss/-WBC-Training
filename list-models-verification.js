async function listModels() {
    const GEMINI_API_KEY = "AIzaSyBvJGDQ0kUCPqzF1MOX4Sho1KpiTKbB3-k";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Error listing models:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

listModels();
