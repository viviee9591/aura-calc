const BASE = "http://localhost:5000/api";
const API = `${BASE}/history`;

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// GET /api/history
export const getHistory = () => request(API);

// POST /api/history
export const saveHistory = (expression, result) =>
  request(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expression, result }),
  });

// DELETE /api/history/:id
export const deleteHistory = (id) =>
  request(`${API}/${id}`, { method: "DELETE" });

// DELETE /api/history
export const clearHistory = () => request(API, { method: "DELETE" });

// POST /api/ask  (the AI assistant)
export async function askAI(question, history) {
  let res;
  try {
    res = await fetch(`${BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    const err = new Error("Can't reach the server. Is the backend running?");
    err.status = 0;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "AI request failed");
    err.status = res.status;
    throw err;
  }
  return data.answer;
}