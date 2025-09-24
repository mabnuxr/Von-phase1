import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScaleKit from '../lib/scalekit';

const Callback = () => {
  const Navigation = useNavigate();
  const [isExchanging, setIsExchanging] = useState(false);
  const UrlParams = new URLSearchParams(window.location.search);
  const code = UrlParams.get('code');

  useEffect(() => {
    if (!isExchanging && code) {
      setIsExchanging(true);
      handleCallback().finally(() => setIsExchanging(false));
    }
  }, [code, isExchanging]);

  const handleCallback = async () => {
    try {
      if (!code) {
        throw new Error('No authorization code received');
      }
      const tokenResponse = await ScaleKit.exchangeCodefortoken({
        code,
        requiredUrl: `${window.location.origin}/callback`,
      });
      if (tokenResponse && tokenResponse.access_token) {
        localStorage.setItem('ScaleKit_token', tokenResponse.access_token);
        Navigation('/dashboard');
      } else {
        throw new Error('No access token received');
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
