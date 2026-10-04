const getHeaders = (overrideKey?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const userKey = overrideKey !== undefined ? overrideKey : localStorage.getItem('user_gemini_api_key');
  if (userKey && userKey.trim()) {
    headers['x-gemini-key'] = userKey.trim();
  }
  return headers;
};

async function handleApiError(response: Response) {
  const text = await response.text();
  let errorMsg = text;
  try {
    const data = JSON.parse(text);
    if (data.error) {
      errorMsg = data.error;
    }
  } catch {
    // text is not JSON, use as-is
  }

  // If the error message is still a JSON string or ApiError
  try {
    const parsed = JSON.parse(errorMsg);
    if (parsed.error && parsed.error.message) {
      errorMsg = parsed.error.message;
    }
  } catch {}

  throw new Error(errorMsg || `API Request failed with status ${response.status}`);
}

export async function testGeminiApiKey(customKey?: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/config/test-key', {
      method: 'POST',
      headers: getHeaders(customKey),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      return { ok: false, error: data.error || 'Failed to validate API key.' };
    }
    return { ok: true, message: data.message || 'API key validated successfully!' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error while testing key.' };
  }
}

export async function generateText(prompt: string, systemInstruction?: string, model: string = "gemini-3.7-flash") {
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

export async function sendChatMessage(messages: any[], systemInstruction?: string, model: string = "gemini-3.7-flash") {
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


