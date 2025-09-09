export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages = [], access_code } = req.body || {};
    if (process.env.ACCESS_CODE && access_code !== process.env.ACCESS_CODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 600, // keep costs low
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: "Upstream error", detail: data });

    res.json({ reply: data.choices?.[0]?.message?.content ?? "" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
