import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Initialize Google Gen AI
function getAI(req?: express.Request): GoogleGenAI {
  const envKey = process.env.GEMINI_API_KEY || "";
  const clientKey = req?.headers['x-gemini-key'] as string;
  const key = (clientKey && clientKey.trim() && clientKey !== "undefined") ? clientKey.trim() : envKey;

  if (!key || key === 'MY_GEMINI_API_KEY' || key.includes('your_api_key') || key === 'undefined') {
    throw new Error('Please configure a valid Gemini API key in the Secrets panel or the custom settings panel.');
  }

  return new GoogleGenAI({ 
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

function formatGeminiError(error: any): { status: number, message: string } {
  const errMsg = error?.message || String(error);
  
  if (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID')) {
    return {
      status: 401,
      message: 'Gemini API key is invalid. Please enter a valid Gemini API key in the API Configuration menu in the sidebar or under Settings > Secrets.'
    };
  }
  if (errMsg.includes('Please configure a valid Gemini API key')) {
    return {
      status: 401,
      message: errMsg
    };
  }
  if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
    return {
      status: 429,
      message: 'Gemini API quota exceeded. Please wait a moment or provide your own API key in the API Configuration panel.'
    };
  }
  
  // Try to parse nested json message if any
  try {
    const jsonMatch = errMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return { status: 400, message: parsed.error.message };
      }
    }
  } catch (_) {}

  return { status: 500, message: errMsg };
}

// API Routes

app.get("/api/config/status", (req, res) => {
  const envKey = process.env.GEMINI_API_KEY || "";
  const hasServerKey = !!(envKey && envKey !== 'MY_GEMINI_API_KEY' && !envKey.includes('your_api_key'));
  res.json({ hasServerKey });
});

app.post("/api/config/test-key", async (req, res) => {
  try {
    const response = await getAI(req).models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });
    if (response?.text) {
      res.json({ ok: true, message: "API key is valid and connected successfully!" });
    } else {
      res.status(500).json({ ok: false, error: "Empty response from Gemini API" });
    }
  } catch (error: any) {
    const formatted = formatGeminiError(error);
    res.status(formatted.status).json({ ok: false, error: formatted.message });
  }
});

app.post("/api/gemini/text", async (req, res) => {
  try {
    const { prompt, systemInstruction, model = "gemini-3.7-flash" } = req.body;
    const response = await getAI(req).models.generateContent({
      model: model as any,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/gemini/text:", error);
    const formatted = formatGeminiError(error);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post("/api/gemini/feedback", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await getAI(req).models.generateContent({
      model: "gemini-3.7-flash" as any,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert interview coach acting as a Senior Hiring Manager. Analyze the user's response to an interview question. Provide feedback in a strict JSON format focusing on Content, Tone, Clarity, and specific common mistakes like filler words, STAR method usage, and example clarity.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["analysis", "strengths", "improvements"]
            },
            tone: {
               type: Type.OBJECT,
               properties: {
                 analysis: { type: Type.STRING },
                 advice: { type: Type.STRING }
               },
               required: ["analysis", "advice"]
            },
            clarity: {
               type: Type.OBJECT,
               properties: {
                 score: { type: Type.NUMBER },
                 analysis: { type: Type.STRING }
               },
               required: ["score", "analysis"]
            },
            fillerWords: {
               type: Type.OBJECT,
               properties: {
                 count: { type: Type.NUMBER },
                 examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                 analysis: { type: Type.STRING }
               },
               required: ["count", "examples", "analysis"]
            },
            starMethod: {
               type: Type.OBJECT,
               properties: {
                 used: { type: Type.BOOLEAN },
                 analysis: { type: Type.STRING }
               },
               required: ["used", "analysis"]
            },
            examples: {
               type: Type.OBJECT,
               properties: {
                 clarity: { type: Type.STRING },
                 advice: { type: Type.STRING }
               },
               required: ["clarity", "advice"]
            },
            actionableTip: { type: Type.STRING }
          },
          required: ["content", "tone", "clarity", "fillerWords", "starMethod", "examples", "actionableTip"]
        }
      }
    });

    let feedback;
    try {
      feedback = JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse AI feedback JSON:", e);
      feedback = null;
    }
    res.json({ feedback });
  } catch (error: any) {
    console.error("Error in /api/gemini/feedback:", error);
    const formatted = formatGeminiError(error);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post("/api/gemini/resume", async (req, res) => {
  try {
    const { fileBase64, mimeType } = req.body;
    const response = await getAI(req).models.generateContent({
      model: "gemini-3.7-flash" as any,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType,
              }
            },
            { text: "Analyze this resume and suggest 3-5 suitable job roles. For each role, explain why the candidate is a good fit based on their experience and skills. Also, provide 2-3 areas of improvement to make the resume stronger." }
          ]
        }
      ]
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/gemini/resume:", error);
    const formatted = formatGeminiError(error);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, model = "gemini-3.7-flash" } = req.body;
    const contents = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content || m.text }]
    }));

    const response = await getAI(req).models.generateContent({
      model: model as any,
      contents: contents,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/gemini/chat:", error);
    const formatted = formatGeminiError(error);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post("/api/gemini/image", async (req, res) => {
  try {
    const { prompt, size = "1K" } = req.body;
    const response = await getAI(req).models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // @ts-ignore
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      }
    });

    let data = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        data = part.inlineData.data;
        break;
      }
    }
    res.json({ data });
  } catch (error: any) {
    console.error("Error in /api/gemini/image:", error);
    const formatted = formatGeminiError(error);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post("/api/verify-linkedin", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes("linkedin.com/in/")) {
      return res.json({ valid: false, message: "Invalid LinkedIn URL format" });
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // 200 status or 999 (LinkedIn's anti-scraping often returns 999 but means it exists)
    if (response.ok || response.status === 999) {
       res.json({ valid: true, message: "Profile verified" });
    } else {
       res.json({ valid: false, message: "Profile not found or not public" });
    }
  } catch (err) {
    res.json({ valid: false, message: "Could not verify profile" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
