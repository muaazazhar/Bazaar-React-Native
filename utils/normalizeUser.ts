import type { User } from '@/types/domain';
import { nonEmptyText, resolvePersonNames } from '@/utils/userDisplay';

export function normalizeUser(raw: unknown): User {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const verifiedRaw = record.isVerified ?? record.is_verified;
  const isVerified =
    verifiedRaw === true || verifiedRaw === 'true' || verifiedRaw === 1;

  const { firstName, lastName } = resolvePersonNames(
    record.firstName ?? record.first_name,
    record.lastName ?? record.last_name,
    record.name ?? record.fullName ?? record.full_name,
  );

  return {
    id: String(record.id ?? ''),
    email: String(record.email ?? ''),
    username: record.username != null ? String(record.username) : undefined,
    firstName,
    lastName,
    phone:
      record.phone != null
        ? String(record.phone).trim() || null
        : record.phone_number != null
          ? String(record.phone_number).trim() || null
          : null,
    role: record.role === 'admin' ? 'admin' : 'user',
    isVerified,
  };
}
