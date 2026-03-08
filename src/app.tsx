import React from 'react';
import { AuthProvider } from './contexts/AuthContext';

const App = (props: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {props.children}
    </AuthProvider>
  );
};

export default App;
