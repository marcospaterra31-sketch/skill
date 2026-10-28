import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, avatarUrl?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        avatarUrl,
        role: 'CREATOR',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    // Tenta fallback de busca caso ocorra qualquer colisão
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) return existing[0];
    throw new Error('Falha ao registrar ou buscar usuário no banco de dados.', { cause: error });
  }
}
