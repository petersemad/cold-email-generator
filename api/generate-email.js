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
You are a cold email expert and seasoned conversion copywriter. Your task is to write a 3-step cold email sequence that gets positive replies from busy B2B decision-makers.

Output must be in JSON format like this:
[
  {
    "subject": "Short, punchy subject line",
    "body": "Body under 85 words",
    "delay": "0 days"
  },
  ...
]

Email 1 should follow this structure:
1. A personalized observation about the recipient’s industry, job title, or company (Why them?)
2. A relevant problem or missed opportunity they may face
3. The dream outcome or transformation your solution offers (with optional proof)
4. A soft, non-pushy CTA that opens a conversation

Requirements:
- No markdown, no code blocks
- Keep it simple, 5th grade English
- No sales-y language, no pressure
- Use a natural human tone
- Include short subject lines inspired by these examples:
  "Automate Outreach?", "Scale Leads?", "Reply Rates Up?", "30% More Replies?"

Here’s the context:
Company: ${company}
Website: ${website}
Ideal Customer Profile: ${icp}
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
