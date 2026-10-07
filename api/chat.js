// api/chat.js (Vercel Serverless Function)
export default async function handler(req, res) {
  // CORSの設定（HTMLからのアクセスを許可する）
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Vercelの環境変数からAPIキーを取得
  const apiKey = process.env.GeminiAPI;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured on Vercel.' });
  }

  try {
    const { prompt } = req.body;

    // Gemini APIへリクエストを送信
    const response = await fetch(`https://googleapis.com{apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
