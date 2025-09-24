import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

export default function RootGate() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const targetUrl = new URL(config.authBase).toString();
      const redirectTimeout = setTimeout(() => {
        window.location.href = targetUrl;
      }, 100);
      return () => clearTimeout(redirectTimeout);
    } catch (error) {
      console.error('Redirect failed:', error);
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  return <div>Redirecting to SSO… If not redirected, you can continue to the login page.</div>;
}


