import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 临时内联 AuthProvider 以测试问题
const AuthContext = createContext<any>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const value = {
    user,
    isAuthenticated: false,
    login: async () => false,
    logout: async () => {},
    hasRole: () => false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const App = (props: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {props.children}
    </AuthProvider>
  );
};

export default App;
