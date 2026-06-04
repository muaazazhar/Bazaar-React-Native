/** Updated from root layout so session logout does not remount login unnecessarily. */
let trackedPathname = '';

export function setTrackedPathname(pathname: string) {
  trackedPathname = pathname;
}

export function isAuthFlowScreen(): boolean {
  return trackedPathname === '/login' || trackedPathname.startsWith('/verify-email');
}
