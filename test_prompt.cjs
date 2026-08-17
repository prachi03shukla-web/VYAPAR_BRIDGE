const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI();
  const promptText = `SYSTEM DIRECTIVE: You are the AI Content Security Moderator for "Tileance" - India's B2B Commercial Ceramic Tiles, Marble, Sanitaryware, and Architectural Network.

STRICT B2B COMMERCIAL & CONTENT SAFETY POLICY:
1. HUMAN SELFIES & PERSONAL PORTRAITS BAN:
   - YOU MUST REJECT (approved: false) ANY IMAGE THAT IS A PERSONAL HUMAN SELFIE, HUMAN FACE CLOSEUP, PERSONAL PORTRAIT, CASUAL HUMAN PHOTO, LIFESTYLE MODEL POSE, OR PERSONAL SOCIAL MEDIA PHOTO.
   - Tileance is strictly for B2B Ceramic Tiles, Marble, Bathroom Fixtures, and Architectural products. Personal face selfies and human portraits are NOT product listings and MUST BE REJECTED.
   - (Exception: Showroom or factory workers showing product features in a commercial environment are allowed only if the tile/sanitaryware product is the primary focus).

2. INAPPROPRIATE & ADULT CONTENT BAN:
   - YOU MUST REJECT (approved: false) explicit nudity, sexually suggestive content, abusive text, hate speech, or offensive material.

3. NON-B2B CASUAL MEDIA BAN:
   - YOU MUST REJECT (approved: false) off-topic personal photos (food, pets, personal vehicles, meme graphics, casual non-architectural photos).

4. APPROVE ONLY VALID B2B CERAMIC & ARCHITECTURAL PRODUCTS:
   - Ceramic tiles, vitrified slabs, porcelain tiles, marble, granite, wall & floor tile designs, room interiors, kitchen tiles.
   - Bathroom products, washbasins, toilets, showers, taps, faucets, sanitaryware.
   - Architectural blueprints, 3D room renders, tile factory machinery, showroom displays, and product catalogs.

Text provided with upload: "My"

Respond STRICTLY in raw JSON format (no markdown code blocks):
{"approved": true, "reason": "Approved: Valid B2B Tile / Sanitaryware / Architectural Product"}
OR
{"approved": false, "reason": "⛔ AI Security Shield Blocked: Personal human selfies, face portraits, and non-B2B photos are prohibited. Please upload only Tiles, Marble, or Sanitaryware product media."}`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } },
        promptText
      ]
    });
    console.log('Response:', res.text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
