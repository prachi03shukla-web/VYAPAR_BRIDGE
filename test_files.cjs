const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
async function test() {
  const ai = new GoogleGenAI();
  try {
    console.log(typeof ai.files.upload);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
