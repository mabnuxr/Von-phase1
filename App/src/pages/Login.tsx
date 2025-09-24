import React from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { randomString, sha256, base64UrlEncode } from '../lib/pkce';

export default function Login() {
  const navigate = useNavigate();

  async function start() {
    const codeVerifier = randomString(64);
    const challengeBuffer = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(challengeBuffer);
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    const authorizeUrl = new URL(config.authorizePath, config.authBase);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', config.clientId);
    authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
    authorizeUrl.searchParams.set('scope', 'openid profile offline_access');
    authorizeUrl.searchParams.set('state', crypto.randomUUID());
    authorizeUrl.searchParams.set('code_challenge', codeChallenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');

    window.location.href = authorizeUrl.toString();
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>
      <button onClick={start}>Continue with SSO</button>
      <button onClick={() => navigate('/')}>Back</button>
    </div>
  );
}


