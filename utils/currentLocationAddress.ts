import { FIELD_LIMITS } from '@/constants/fieldLimits';

type GeolocationPosition = {
  coords: { latitude: number; longitude: number };
};

export async function fetchAddressFromCurrentLocation(
  maxLength = FIELD_LIMITS.address,
): Promise<string> {
  const geolocation = globalThis.navigator?.geolocation;
  if (!geolocation) {
    throw new Error('Location service is unavailable on this build.');
  }

  const position = (await new Promise<GeolocationPosition>((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 10000,
    });
  })) as GeolocationPosition;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
  );
  if (!response.ok) {
    throw new Error('Could not resolve address for current location.');
  }

  const data = (await response.json()) as { display_name?: string };
  if (!data.display_name?.trim()) {
    throw new Error('Could not resolve address for current location.');
  }

  return data.display_name.slice(0, maxLength);
}
