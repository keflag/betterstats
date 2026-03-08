import React from 'react';
import { AuthProvider } from './contexts/AuthContext';

export function Root(props: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {props.children}
    </AuthProvider>
  );
}

export default Root;
