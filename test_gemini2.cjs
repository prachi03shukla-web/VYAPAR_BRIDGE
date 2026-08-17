const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Respond strictly with JSON { \"approved\": false }"
        });
        console.log("type:", typeof response.text);
        console.log("val:", response.text);
        
        let responseText = '';
        if (response?.text && typeof response.text === 'string') {
            responseText = response.text;
        } else if (response?.response?.text) {
            responseText = typeof response.response.text === 'function' ? response.response.text() : String(response.response.text);
        }
        console.log("parsed responseText:", responseText);
    } catch (e) {}
}
run();
