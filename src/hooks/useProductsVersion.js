import { useState, useEffect } from 'react';
import { subscribe } from '../services/demoStore';

// Returns a number that increments whenever the demo product store changes
// (admin add, super-admin approve/reject, or any delete). Pass it into a
// useFetch/useEffect dependency list so storefront views re-pull and reflect
// approvals/deletions immediately — including across tabs. In real-API mode the
// store is idle, so this simply stays at 0.
export function useProductsVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((n) => n + 1)), []);
  return version;
}

export default useProductsVersion;
