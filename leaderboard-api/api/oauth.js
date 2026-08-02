export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, game, score } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const CLIENT_ID = process.env.GH_CLIENT_ID;
  const CLIENT_SECRET = process.env.GH_CLIENT_SECRET;
  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO || 'cxf54188/cxf54188.github.io';

  if (!CLIENT_ID || !CLIENT_SECRET || !GH_TOKEN) {
    return res.status(500).json({ error: 'Missing server env vars' });
  }

  let accessToken;

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: 'Failed to exchange token',
        github: tokenData
      });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Token exchange error', detail: String(e) });
  }

  let login;

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    const userData = await userRes.json();
    login = userData.login;

    if (!login) {
      return res.status(400).json({
        error: 'Failed to get GitHub user',
        github: userData
      });
    }
  } catch (e) {
    return res.status(500).json({ error: 'User fetch error', detail: String(e) });
  }

  try {
    const issueRes = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `[${game || 'game'}] ${login} - ${score || 0}`,
        body: `游戏: ${game || 'unknown'}\n玩家: ${login}\n分数: ${score || 0}`,
        labels: ['leaderboard', `game-${game || 'unknown'}`]
      })
    });

    const issueData = await issueRes.json();

    if (!issueRes.ok) {
      return res.status(500).json({
        error: 'Failed to create issue',
        github: issueData
      });
    }

    return res.status(200).json({
      ok: true,
      login,
      issue: issueData.html_url
    });
  } catch (e) {
    return res.status(500).json({ error: 'Issue create error', detail: String(e) });
  }
}