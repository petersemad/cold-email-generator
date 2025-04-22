export default async function handler(req, res) {
  // ——— CORS HEADERS ———
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  // ——————————————

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { companyName, companyWebsite, idealCustomerProfile } = req.body;

  if (!companyName || !companyWebsite || !idealCustomerProfile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `
You are a B2B outbound strategist. Your task is to generate a cold email sequence of 3 emails to engage the following company's ideal customers.

Here’s the input:

Company Name: ${companyName}
Website: ${companyWebsite}
Ideal Customer Profile (ICP): ${idealCustomerProfile}

Generate 3 emails as a JSON array. Each email should include:
- "subject": short and engaging subject line
- "body": concise body text (under 120 words)
- "delay": number of days after the previous email (use 0 for the first one)

The response MUST be formatted like this (no explanation):

[
  {
    "subject": "Subject line here",
    "body": "Body here...",
    "delay": 0
  },
  ...
]
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    let sequence;
    try {
      sequence = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Failed to parse GPT response as JSON' });
    }

    return res.status(200).json({ sequence });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
