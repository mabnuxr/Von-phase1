import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScaleKit from '../lib/scalekit';

const Callback = () => {
  const Navigation = useNavigate();

  useEffect(() => {
    handleCallback();
  });

  const handleCallback = async () => {
    try {
      const UrlParams = new URLSearchParams(window.location.search);
      const code = UrlParams.get('code');
      if (code) {
        const tokenResponse = await ScaleKit.exchangeCodefortoken({
          code,
          requiredUrl: `${window.location.href}/callback`,
        });
        localStorage.setItem('ScaleKit_itm', tokenResponse.access_token);
        Navigation('/dashboard');
      } else {
        throw new Error('No authorization code received');
      }
    } catch (error) {
      console.error('Callback handling failed:', error);
      Navigation('/login?error=auth_failed');
    }
  };

  return (
    <div className="callback-container">
      <p>Processing authentication...</p>
    </div>
  );
};
export default Callback;
