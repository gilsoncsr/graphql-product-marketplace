import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * Hook personalizado para acessar o contexto de autenticação
 * 
 * @returns {AuthContextType} Objeto com estado e funções de autenticação
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <div>Olá, {user?.firstName}!</div>;
 * }
 * 
 * return <LoginForm onSubmit={login} />;
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
