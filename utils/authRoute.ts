/** Updated from root layout so session logout does not remount login unnecessarily. */
let trackedPathname = '';

export function setTrackedPathname(pathname: string) {
  trackedPathname = pathname;
}

export function isAuthFlowScreen(): boolean {
  return (
    trackedPathname === '/login' ||
    trackedPathname.startsWith('/verify-email') ||
    trackedPathname.startsWith('/forgot-password') ||
    trackedPathname.startsWith('/verify-reset-otp') ||
    trackedPathname.startsWith('/reset-password')
  );
}

export function isAdminScreen(): boolean {
  return trackedPathname === '/admin' || trackedPathname.startsWith('/admin-');
}
