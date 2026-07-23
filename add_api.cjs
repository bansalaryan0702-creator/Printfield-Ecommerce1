const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const apiCode = `
  app.post('/api/ai/generate-card-description', verifyAdmin, async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { name, category, description } = req.body;
      const prompt = \`Generate a short, engaging product card description (1-3 sentences) for a product.
Product Name: \${name}
Category: \${category}
Main Description: \${description}

Requirements:
- Make it compelling for e-commerce.
- Keep it concise (max 150 characters).
- IMPORTANT: Ensure it starts with unique and varied wording, avoiding generic openings like "Introducing" or "Experience" every time. Be creative with the first word.
- Output ONLY the generated description without any extra text or quotes.\`;

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      res.json({ description: response.text?.trim() });
    } catch (error: any) {
      console.error('AI Suggest Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate' });
    }
  });

`;

code = code.replace("app.post('/api/ai/suggest-text', async (req, res) => {", apiCode + "  app.post('/api/ai/suggest-text', async (req, res) => {");

fs.writeFileSync('server.ts', code);
