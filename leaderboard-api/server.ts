const GH_REPO = Deno.env.get("GH_REPO") || "";
const GH_TOKEN = Deno.env.get("GH_TOKEN") || "";
const GH_CLIENT_ID = Deno.env.get("GH_CLIENT_ID") || "";
const GH_CLIENT_SECRET = Deno.env.get("GH_CLIENT_SECRET") || "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json;charset=UTF-8" },
  });
}

async function ghFetch(path: string, init: RequestInit = {}) {
  const resp = await fetch("https://api.github.com" + path, {
    ...init,
    headers: {
      "Authorization": `token ${GH_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "deno-leaderboard",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await resp.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = text; }

  return { ok: resp.ok, status: resp.status, data };
}

async function exchangeToken(code: string) {
  const params = new URLSearchParams({
    client_id: GH_CLIENT_ID,
    client_secret: GH_CLIENT_SECRET,
    code,
  });

  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GH_CLIENT_ID,
      client_secret: GH_CLIENT_SECRET,
      code,
    }),
  });

  return await resp.json();
}

async function getUser(token: string) {
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      User-Agent: "deno-leaderboard",
    },
  });
  return await resp.json();
}

async function createIssue(
  repo: string,
  token: string,
  title: string,
  bodyText: string,
  labels: string[]
) {
  return ghFetch(`/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body: bodyText, labels }),
  });
}

function sanitize(input: string, max = 80) {
  return input.replace(/[^\w\u4e00-\u9fa5\-_. ]/g, "").slice(0, max);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/") {
    return json({ ok: true, service: "leaderboard-api", repo: GH_REPO });
  }

  if (req.method === "POST" && url.pathname === "/submit") {
    if (!GH_REPO || !GH_TOKEN || !GH_CLIENT_ID || !GH_CLIENT_SECRET) {
      return json({ error: "Server env not configured" }, 500);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const code = String(body.code || "");
    const game = sanitize(String(body.game || "unknown"), 50);
    const score = String(body.score || "0");

    if (!code) return json({ error: "Missing code" }, 400);

    const oauth = await exchangeToken(code);
    const accessToken = oauth.access_token;

    if (!accessToken) {
      return json({ error: "GitHub token exchange failed", detail: oauth }, 400);
    }

    const user = await getUser(accessToken);
    const login = user.login;

    if (!login) {
      return json({ error: "Failed to get GitHub user", detail: user }, 400);
    }

    const safeGame = sanitize(game, 50);
    const title = `Leaderboard: ${safeGame} - ${login} - ${score}`;
    const bodyText =
      `Game: ${safeGame}\n` +
      `Player: ${login}\n` +
      `Score: ${score}\n` +
      `Submitted at: ${new Date().toISOString()}`;

    const labels = ["leaderboard", `game-${safeGame}`];

    const issue = await createIssue(GH_REPO, GH_TOKEN, title, bodyText, labels);

    if (!issue.ok) {
      return json({ error: "Issue create failed", status: issue.status, detail: issue.data }, 500);
    }

    return json({ ok: true, login, issue: issue.data.html_url });
  }

  return json({ error: "Not found" }, 404);
});