/** Maps an RTK array response through a normalizer. */
export function mapArrayResponse<T>(response: unknown, normalize: (raw: unknown) => T): T[] {
  const payload = Array.isArray(response) ? response : [];
  return payload.map(normalize);
}
