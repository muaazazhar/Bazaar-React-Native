import type { User } from '@/types/domain';

type UserNameFields = Pick<User, 'firstName' | 'lastName' | 'username' | 'email'>;

export function nonEmptyText(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

export function splitLegacyName(legacyName: string): { firstName?: string; lastName?: string } {
  const parts = legacyName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  };
}

export function resolvePersonNames(
  firstNameRaw: unknown,
  lastNameRaw: unknown,
  legacyNameRaw?: unknown,
): { firstName?: string; lastName?: string } {
  const firstName = nonEmptyText(firstNameRaw);
  const lastName = nonEmptyText(lastNameRaw);
  if (firstName || lastName) {
    return { firstName, lastName };
  }
  const legacyName = nonEmptyText(legacyNameRaw);
  return legacyName ? splitLegacyName(legacyName) : {};
}

export function formatUserDisplayName(
  user: UserNameFields | null | undefined,
  fallback = '—',
): string {
  const parts = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  if (parts.length > 0) {
    return parts.join(' ');
  }
  const username = user?.username?.trim();
  if (username) return username;
  const email = user?.email?.trim();
  if (email) return email.split('@')[0] ?? fallback;
  return fallback;
}
