// Lightweight form validation helpers

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v || '').replace(/\s+/g, ''));

export const minLen = (v, n) => String(v || '').length >= n;

export const required = (v) => String(v ?? '').trim().length > 0;

// Returns { field: message } map of errors; empty object means valid.
export const validate = (values, rules) => {
  const errors = {};
  for (const field of Object.keys(rules)) {
    const checks = rules[field];
    for (const check of checks) {
      const msg = check(values[field], values);
      if (msg) {
        errors[field] = msg;
        break;
      }
    }
  }
  return errors;
};
