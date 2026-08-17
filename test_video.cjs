const { GoogleGenAI } = require('@google/genai');
async function test() {
  const ai = new GoogleGenAI('my_key_foo');
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType: 'video/mp4', data: 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAALt' } },
        "What is this?"
      ]
    });
    console.log('Success:', res.text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
