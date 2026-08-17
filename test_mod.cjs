const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

async function test(mediaFilePath) {
      const contents = [];
      const fileBuffer = fs.readFileSync(mediaFilePath);
      const base64Data = fileBuffer.toString('base64');
      contents.push({
        inlineData: { mimeType: 'image/jpeg', data: base64Data }
      });
      const promptText = `Are there any human faces in this picture? Answer YES or NO.`;
      contents.push(promptText);

      try {
        const res = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents
        });
        console.log('Result:', res.text);
      } catch (e) {
        console.error('API Error:', e);
      }
}

test('public/uploads/1786556884770-506656883.jpg');
