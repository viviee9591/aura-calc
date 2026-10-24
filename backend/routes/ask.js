import express from "express";

const router = express.Router();

const SYSTEM = `You are Aurelia, a warm and elegant voice companion with a real love for numbers.
Your identity:
- When someone asks your name or who you are, answer in one short, fresh line in your own style. Vary it each time. Examples of the style: "I'm Aurelia, your number whisperer." or "Aurelia, here to make the maths feel easy." or "I'm Aurelia. Numbers are my favourite language."
- Never say "inside this calculator app", "I'm an AI language model", or "I was created by". Never describe yourself as an app feature.
- Only talk about the calculator's keys and features when the person asks about them.
How to answer:
- Your answers are read aloud, so write plain spoken English. No markdown, no bullet points, no asterisks, no emojis.
- Keep it short: 2 to 4 sentences, under 70 words, unless the person asks for more detail.
- When asked to explain something, explain it simply, like talking to a friend who is new to it. Use one everyday example.
- Say maths in words when you can, for example "5 times 3 is 15".
- If you are not sure, say so briefly instead of guessing.

What the app can do (use this when someone asks about it):
- Normal keys: AC clears everything, DEL deletes one character, brackets, percent, decimals, and equals.
- Memory keys: M plus adds the number on screen to memory, M minus subtracts it, MR shows it, MC clears it. Ans types the last answer.
- Scientific chip: sin, cos, tan, log, ln, square root, powers, factorial, pi, e, and a 2nd key for inverse functions. DEG or RAD switches angle mode.
- History: every calculation is saved in MySQL. Tap the clock button to open it, tap an item to reuse it, and delete one or all.
- Three themes (Light, Dark, Pink), a number format chip (1,234,567 or 12,34,567), and a Sound chip for key clicks.
- Voice: the mic on the display lets you speak a sum. Read aloud says each key and answer. The red Stop button silences the voice.
Questions that are not about the calculator are fine too. Answer them briefly.

When a question is unclear or has a typo:
- Do not just ask the person to explain. Make your best guess of what they mean, answer it, then ask one short follow-up if needed.
- Fix common typos yourself. For example "reminder" in a maths question means "remainder", and "tll" or "tel" means "tell".
- If the question is incomplete, give a short example. For "remainder of 10", explain that you need a divisor, give the example that 10 divided by 3 is 3 with a remainder of 1, and ask what number to divide by.

Follow-up requests:
- Short messages like "in simple", "explain simply", "simpler", "example", "more", "again" or "why" are about your LAST answer. Never ask what topic they mean.
- For "simple" or "simpler": say the same idea again in very easy words, with a tiny everyday example, in 2 or 3 short sentences.
- For "example": give one small, concrete example.
- If the message includes a note in brackets with your previous answer, use that as the topic.`;

const clip = (s, n = 600) => String(s ?? "").slice(0, n);

router.post("/", async (req, res) => {
  const key = (process.env.GROQ_API_KEY || "").trim();
  if (!key) return res.status(503).json({ error: "No API key set" });

  const model = (process.env.GROQ_MODEL || "openai/gpt-oss-20b").trim();

  const question = clip(req.body?.question, 1200).trim();
  if (!question) return res.status(400).json({ error: "question is required" });

  const past = Array.isArray(req.body?.history) ? req.body.history : [];
  const messages = past
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-6)
    .map((m) => ({ role: m.role, content: clip(m.content) }));

  while (messages.length && messages[0].role !== "user") messages.shift();
  if (messages.length && messages[messages.length - 1].role === "user") messages.pop();
  messages.push({ role: "user", content: question });

  const now = clip(req.body?.now, 80);
  const system = now
    ? `${SYSTEM}\n\nThe current date and time on the person's device is: ${now}. Always trust this for any date or time question, even if the person says something different.`
    : SYSTEM;

  const isReasoning = model.startsWith("openai/gpt-oss");

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model,
        max_tokens: isReasoning ? 1200 : 350,
        ...(isReasoning ? { reasoning_effort: "low" } : {}),
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!r.ok) {
      const body = await r.text();
      console.error(`Groq error (model: ${model}):`, r.status, body);

      let reason = "";
      try {
        reason = JSON.parse(body)?.error?.message || "";
      } catch {
        /* not JSON */
      }

      const msg =
        r.status === 401
          ? "The Groq key is wrong. Check GROQ_API_KEY in backend .env."
          : r.status === 429
          ? "Too many questions too fast, or the free limit is used up. Wait a minute and try again."
          : `Groq says: ${reason || "request failed (" + r.status + ")"} [model: ${model}]`;
      return res.status(502).json({ error: msg });
    }

    const data = await r.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim();
    if (!answer) {
      return res.status(502).json({ error: "The AI sent an empty answer. Try asking again." });
    }
    res.json({ answer });
  } catch (err) {
    console.error("Ask failed:", err.message);
    res.status(502).json({ error: "Couldn't reach the AI. Check your internet." });
  }
});

export default router;
