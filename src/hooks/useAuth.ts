import { useState } from 'react';

export const useAuth = () => {
  const getUser = () => {
    const email = localStorage.getItem('userEmail');
    if (!email) return null;
    return {
      email,
      id: email,
      name: email.split('@')[0]
        .split('.')
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' '),
    };
  };

  const [user, setUser] = useState(getUser());

  const signOut = () => {
    localStorage.removeItem('userEmail');
    setUser(null);
    window.location.reload();
  };

  return {
    user,
    loading: false,
    error: null,
    signOut,
  };
};
