import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase.ts';
import { User, Workspace, UserRole } from '../../types/index.ts';

export interface AuthContextType {
  usuario: User | null;
  workspaceAtivo: Workspace | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  carregando: boolean;
  loginComGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  estaAutenticado: boolean;
  obterTokenAuth: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [workspaceAtivo, setWorkspaceAtivo] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Sincroniza o usuário do Firebase com o PostgreSQL na API /api/auth/sync
  const sincronizarComBanco = useCallback(async (fbUser: FirebaseUser, idToken: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsuario(data.user);
        setWorkspaceAtivo(data.workspace);
      } else {
        // Fallback local se o endpoint falhar
        setUsuario({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Desenvolvedor',
          avatarUrl: fbUser.photoURL || undefined,
          role: UserRole.CREATOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Erro na sincronização de usuário com o banco:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          await sincronizarComBanco(fbUser, idToken);
        } catch (err) {
          console.error('Erro ao recuperar token do Firebase:', err);
        }
      } else {
        setUsuario(null);
        setWorkspaceAtivo(null);
        setToken(null);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [sincronizarComBanco]);

  const loginComGoogle = async () => {
    setCarregando(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await sincronizarComBanco(cred.user, idToken);
    } catch (err) {
      console.error('Erro ao fazer login com Google:', err);
      throw err;
    } finally {
      setCarregando(false);
    }
  };

  const logout = async () => {
    setCarregando(true);
    try {
      await firebaseSignOut(auth);
      setUsuario(null);
      setWorkspaceAtivo(null);
      setToken(null);
    } finally {
      setCarregando(false);
    }
  };

  const obterTokenAuth = async (): Promise<string | null> => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        workspaceAtivo,
        firebaseUser,
        token,
        carregando,
        loginComGoogle,
        logout,
        estaAutenticado: Boolean(firebaseUser),
        obterTokenAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
