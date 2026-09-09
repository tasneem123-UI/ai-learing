const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ========== استخدمي gemini-3.5-flash ==========
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.5-flash-lite", // ✅ الأحدث
  generationConfig: {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
});

module.exports = model;