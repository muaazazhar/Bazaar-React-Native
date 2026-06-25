import * as Linking from 'expo-linking';

const DEFAULT_WHATSAPP_MESSAGE = 'Hi, I have a question about your store.';

/** Converts local/PK numbers to international digits for wa.me (no + prefix). */
export function toWhatsAppPhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  if (digits.startsWith('92')) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `92${digits}`;
  }
  return digits;
}

export async function openWhatsAppChat(
  phone: string,
  message = DEFAULT_WHATSAPP_MESSAGE,
): Promise<void> {
  const normalized = toWhatsAppPhoneDigits(phone);
  if (!normalized) {
    throw new Error('WhatsApp contact number is not valid.');
  }

  const encodedMessage = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${normalized}&text=${encodedMessage}`;
  const webUrl = `https://wa.me/${normalized}?text=${encodedMessage}`;

  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
