// Decodes the payload of a JWT without verifying its signature — this is a
// client-side convenience for reading `exp`/`iat` to drive UI (like the
// session-timeout warning), never used for anything security-sensitive.
// Verification always happens server-side.
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Returns the token's expiry as a Date, or null if it can't be determined
// (e.g. the demo-mode placeholder token, which isn't a real JWT).
export function getTokenExpiry(token) {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? new Date(payload.exp * 1000) : null;
}
