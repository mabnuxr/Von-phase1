import { useState, useEffect, useContext, createContext } from 'react';
import scaleKit from '../lib/scalekit';

const AuthConntext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CheckAuthStatus();
  }, []);

  const CheckAuthStatus = async () => {
    try {
      const token = localStorage.getItem('ScaleKit_token');
      if (token) {
        const userInfo = await scaleKit.getUser('token');
        setUser(userInfo);
      }
    } catch (error) {
      console.log('Here is the errro', error);
      localStorage.removeItem('ScaleKit_token');
    } finally {
      setLoading(false);
    }
  };

  const Login = async (organtzationId) => {
    try {
      const authUrl = await scaleKit.getAuthorizationUrl({
        organtzationId,
        redirectUrl: `${window.location.origin}/callback`,
      });
      window.location.href = authUrl;
    } catch (error) {
      console.log('here is the error', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('ScaleKit_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthConntext.Provider value={{ user, Login, logout, loading }}>
        {children}
    </AuthConntext.Provider>
  )
};

export const useAuth = () => {
    const context = useContext(AuthConntext);
    if(!context){
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context;
};
