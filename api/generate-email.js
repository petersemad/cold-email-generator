export default async function handler(req, res) {
  // ——— CORS HEADERS ———
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  // ——————————————

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { company, website, icp } = req.body;

  if (!company || !website || !icp) {
    return res.status(400).json({ error: 'Missing required fields: company, website, or icp' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  const prompt = `
You are a B2B cold email strategist.

Generate a cold email sequence of 3 emails in JSON format.
Each email must include:
- subject
- body
- delay (e.g. "0 days", "2 days", "3 days")

The format should be:
[
  {
    "subject": "Email subject here",
    "body": "Email body here...",
    "delay": "0 days"
  },
  ...
]

Avoid explanations. Do NOT include markdown or formatting.

Company name: ${company}
Website: ${website}
Ideal customer profile: ${icp}
`;

  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await apiRes.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return res.status(500).json({ error: 'Empty response from OpenAI' });
    }

    let sequence = [];

    try {
      sequence = JSON.parse(raw);
    } catch (err) {
      console.error('JSON parse failed:', err, raw);
      return res.status(500).json({ error: 'Failed to parse GPT response as JSON.' });
    }

    return res.status(200).json({ sequence });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generating sequence.' });
  }
}
