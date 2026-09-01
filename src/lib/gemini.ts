import { GoogleGenAI, Type } from "@google/genai";

const getHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const userKey = localStorage.getItem('user_gemini_api_key');
  if (userKey) {
    headers['x-gemini-key'] = userKey;
  }
  return headers;
};

async function handleApiError(response: Response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.error) {
      // The server sends { error: error.message }
      // If error.message itself is a JSON string from GoogleGenAI, try to parse it
      try {
        const innerError = JSON.parse(data.error);
        if (innerError.error && innerError.error.message) {
          throw new Error(innerError.error.message);
        }
      } catch {
        // Not JSON, just use as string
      }
      throw new Error(data.error);
    }
  } catch (e) {
    if (e instanceof Error && e.message !== text && e.message !== 'Unexpected end of JSON input' && !e.message.startsWith('Expected property name')) {
      throw e;
    }
  }
  throw new Error(text);
}

export async function generateText(prompt: string, systemInstruction?: string, model: string = "gemini-3-flash-preview") {
  const response = await fetch('/api/gemini/text', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt, systemInstruction, model }),
  });
  if (!response.ok) await handleApiError(response);
  const data = await response.json();
  return data.text;
}

export async function generateStructuredFeedback(prompt: string) {
  const response = await fetch('/api/gemini/feedback', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) await handleApiError(response);
  const data = await response.json();
  return data.feedback;
}

export async function analyzeResume(fileBase64: string, mimeType: string) {
  const response = await fetch('/api/gemini/resume', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fileBase64, mimeType }),
  });
  if (!response.ok) await handleApiError(response);
  const data = await response.json();
  return data.text;
}

export async function sendChatMessage(messages: any[], systemInstruction?: string, model: string = "gemini-3-flash-preview") {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ messages, systemInstruction, model }),
  });
  if (!response.ok) await handleApiError(response);
  const data = await response.json();
  return { text: data.text };
}

export async function generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
  const response = await fetch('/api/gemini/image', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt, size }),
  });
  if (!response.ok) await handleApiError(response);
  const data = await response.json();
  return data.data ? { data: data.data } : null;
}


