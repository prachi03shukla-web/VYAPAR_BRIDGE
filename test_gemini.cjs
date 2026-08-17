const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.log("No API Key");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function run() {
    const contents = [
        { text: "Respond ONLY in JSON. Is 'dil toota hai' a business term?" }
    ];
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });
        console.log("Response text:", response.text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
