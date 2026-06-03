import type { User } from '@/types/domain';

export function normalizeUser(raw: unknown): User {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const verifiedRaw = record.isVerified ?? record.is_verified;
  const isVerified =
    verifiedRaw === true || verifiedRaw === 'true' || verifiedRaw === 1;

  return {
    id: String(record.id ?? ''),
    email: String(record.email ?? ''),
    username: record.username != null ? String(record.username) : undefined,
    role: record.role === 'admin' ? 'admin' : 'user',
    isVerified,
  };
}
