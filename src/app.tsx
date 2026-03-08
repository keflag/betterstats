import { AuthProvider } from '@/contexts/AuthContext';

export function rootContainer(container: React.ReactNode) {
  return (
    <AuthProvider>
      {container}
    </AuthProvider>
  );
}
