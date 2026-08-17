const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.log("No API Key");
    process.exit(1);
}
console.log("Key found");
