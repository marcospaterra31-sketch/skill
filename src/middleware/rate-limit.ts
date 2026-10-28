import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.ts';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request | AuthRequest) => string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Limite de requisições excedido. Tente novamente mais tarde.',
    keyGenerator = (req: Request | AuthRequest) => {
      const authReq = req as AuthRequest;
      return authReq.user?.uid || req.ip || req.socket.remoteAddress || 'unknown';
    },
  } = options;

  const hits = new Map<string, RequestRecord>();

  // Limpeza periódica de chaves expiradas para evitar consumo excessivo de memória
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 30000));

  // Não segura o event loop do Node.js
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyGenerator(req);
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
    }

    next();
  };
}

// Limiter para rotas de alto custo computacional e IA
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 15, // Máximo 15 requisições de IA por minuto por usuário/IP
  message: 'Limite de requisições de IA excedido (máximo 15/min). Aguarde antes de tentar novamente.',
});

// Limiter geral para endpoints da API
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 120, // Máximo 120 requisições por minuto por usuário/IP
  message: 'Taxa de requisições excedida. Aguarde um momento.',
});
