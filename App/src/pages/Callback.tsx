import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { config } from '../config';

export default function Callback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get('code');

  async function exchange() {
    const tokenUrl = new URL(config.tokenPath, config.authBase);
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) {
      alert('Missing PKCE code verifier. Please try logging in again.');
      navigate('/login');
      return;
    }

    const form = new URLSearchParams();
    form.set('grant_type', 'authorization_code');
    form.set('code', code || '');
    form.set('redirect_uri', config.redirectUri);
    form.set('client_id', config.clientId);
    form.set('code_verifier', codeVerifier);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!res.ok) {
      alert('Token exchange failed');
      navigate('/login');
      return;
    }
    const data = await res.json();
    sessionStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) sessionStorage.setItem('refresh_token', data.refresh_token);
    console.log('session tokens', {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    navigate('/dashboard');
  }

  if (!code) {
    return (
      <div style={{ padding: 24 }}>
        <p>Missing authorization code.</p>
        <button onClick={() => navigate('/login')}>Try again</button>
      </div>
    );
  }

  exchange();
  return <div style={{ padding: 24 }}>Processing authentication...</div>;
}


