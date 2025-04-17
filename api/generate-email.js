export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  const { industry, title, offer, tone } = req.body;
  if (!industry || !title || !offer || !tone) {
    return res.status(400).json({ error: 'Missing one of: industry, title, offer, tone' });
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }
  const prompt = `
Generate a short, personalized cold email.

Target Industry: ${industry}
Prospect Job Title: ${title}
My Offer: ${offer}
Tone: ${tone}

Keep it to 3–5 sentences, with a friendly opener and clear call to action.
`;
  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      })
    });
    const json = await apiRes.json();
    const email = json.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OpenAI API error' });
  }
}
