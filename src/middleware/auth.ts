import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Validação de token em ambiente de teste automatizado.
 * Somente ativo se NODE_ENV === 'test' ou TEST_AUTH === 'true'.
 */
function tentarDecodificarTokenTeste(token: string): AuthUser | null {
  const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_AUTH === 'true';
  if (!isTest) return null;

  if (token.startsWith('test_token_')) {
    const parts = token.replace('test_token_', '').split('_');
    const uid = parts[0] || 'test_user';
    const role = parts[1] || 'CREATOR';
    return {
      uid,
      email: `${uid}@skillforge.test`,
      name: `Test User ${uid}`,
      role,
      aud: 'skill-forge-test',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/skill-forge-test',
      sub: uid,
    } as AuthUser;
  }
  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token de autenticação ausente.' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado: Token de autenticação vazio.' });
  }

  // Verificação de token de teste
  const testUser = tentarDecodificarTokenTeste(token);
  if (testUser) {
    req.user = testUser;
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken as AuthUser;
    next();
  } catch (error) {
    console.error('Falha na validação do ID token do Firebase:', error);
    return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      const testUser = tentarDecodificarTokenTeste(token);
      if (testUser) {
        req.user = testUser;
        return next();
      }

      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken as AuthUser;
      } catch {
        // Ignora erro em modo opcional
      }
    }
  }
  next();
};
