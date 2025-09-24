import express from 'express';
import cors from 'cors';
import 'dotenv/config';
// Using global fetch available in Node 18+

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 5176;
const AUTH_BASE = process.env.SCALEKIT_AUTH_BASE_URL ?? 'https://vonlabs-afcu5dgbaafqi.scalekit.dev';
const CLIENT_ID = process.env.SCALEKIT_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.SCALEKIT_CLIENT_SECRET ?? '';
const REDIRECT_URI = process.env.SCALEKIT_REDIRECT_URI ?? '';

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/oauth/exchange', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri, client_id } = req.body ?? {};
    if (!code) {
      return res.status(400).json({ error: 'missing_code' });
    }

    const tokenUrl = new URL(process.env.VITE_AUTH_TOKEN_PATH ?? '/oauth/token', AUTH_BASE).toString();

    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', redirect_uri || REDIRECT_URI);
    params.set('client_id', client_id || CLIENT_ID);
    if (code_verifier) params.set('code_verifier', code_verifier);
    // For confidential client flows, include secret if present
    if (CLIENT_SECRET) params.set('client_secret', CLIENT_SECRET);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'token_exchange_failed', details: data });
    }

    return res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

app.post('/oauth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body ?? {};
    if (!refresh_token) {
      return res.status(400).json({ error: 'missing_refresh_token' });
    }

    const tokenUrl = new URL(process.env.VITE_AUTH_TOKEN_PATH ?? '/oauth/token', AUTH_BASE).toString();

    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', refresh_token);
    params.set('client_id', CLIENT_ID);
    params.set('client_secret', CLIENT_SECRET);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'refresh_failed', details: data });
    }

    return res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

app.listen(PORT, () => {
  console.log(`[auth-server] listening on http://localhost:${PORT}`);
});
