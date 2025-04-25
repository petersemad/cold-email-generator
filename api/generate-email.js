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

  const { company, website, icp, offer, tone } = req.body;

  if (!company || !website || !icp || !offer || !tone) {
    return res.status(400).json({ error: 'Missing required fields: company, website, icp, offer, or tone' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  const prompt = `
You are a cold email expert and seasoned B2B conversion copywriter.

Write a 3-step cold email sequence designed to get replies from busy B2B decision-makers.

The response must be in valid JSON format like this:
[
  {
    "subject": "Short, punchy subject line",
    "body": "Cold email body under 85 words with line breaks",
    "delay": "0 days"
  },
  {
    "subject": "...",
    "body": "...",
    "delay": "3 days"
  },
  {
    "subject": "...",
    "body": "...",
    "delay": "5 days"
  }
]

📬 Email 1 should follow this structure:
1. A personalized observation about the recipient’s industry, job title, or company (Why them?)
2. A relevant problem or missed opportunity they may face
3. The dream outcome or transformation your solution offers (with optional proof)
4. A soft, non-pushy CTA that opens a conversation

📩 Email 2 is a follow-up:
- Reference the first email (e.g., “Just circling back…”)
- Introduce a new angle, value prop, or credibility

📨 Email 3 is a final check-in:
- Short, friendly, “last touch” style
- Restate benefits briefly and invite a reply

🎯 Requirements:
- Keep it under 85 words per email
- 5th grade reading level
- No markdown or code blocks
- Avoid sounding salesy or promotional
- Use short, conversational language and sentence structure
- Use line breaks between paragraphs for readability
- End every email with this signature format (with line breaks):

Best,  
[Your Name]  
${company}  
[Optional Contact Info]

📎 Subject lines should be short and curiosity-driven, similar to:
"Automate Outreach?", "Reply Rates Up?", "Scale Leads?", "30% More Replies?"

Here’s the context for the sequence:
Company: ${company}  
Website: ${website}  
Ideal Customer Profile: ${icp}  
Offer: ${offer}  
Tone: ${tone}
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
