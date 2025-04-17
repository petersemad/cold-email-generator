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

  // ← REPLACE your prompt here:
  const prompt = `
You are an expert outbound sales strategist and cold email copywriter with 10+ years of experience writing B2B cold emails that convert. You specialize in creating short, personalized, high-converting cold emails that spark curiosity and generate replies.

You follow these rules:
- Use a natural, non-pitchy tone
- Never use jargon or buzzwords
- Avoid “I wanted to reach out” and similar fluff
- Always lead with relevance or pain point
- Keep it under 120 words
- End with a low-friction CTA (e.g. “Open to chatting?”)

You adapt the email to the prospect’s role and industry. You may use humor, social proof, or insights depending on the selected tone.

You always return the output in this format:
Subject Line: [Insert Subject Line]
Email Body:
[Email paragraph 1]
[Email paragraph 2]
[Closing + CTA]

Do not include explanations or headers. Only return the formatted cold email.

Generate a cold email using the following details:

Target Industry: ${industry}
Prospect Job Title: ${title}
My Offer: ${offer}
Tone: ${tone} (Choose from: Friendly, Professional, Witty, Casual, Assertive)
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
        max_tokens: 300
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
