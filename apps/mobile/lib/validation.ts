const PRIVATE_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

const PRIVATE_PREFIXES = ['10.', '192.168.', '169.254.'];

export type CanvasUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function sanitizeCanvasUrl(input: string): CanvasUrlResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Enter your school\'s Canvas URL.' };

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: 'That doesn\'t look like a valid URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Canvas URL must use https://.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOSTS.includes(host)) {
    return { ok: false, error: 'That URL points to a local address.' };
  }
  if (PRIVATE_PREFIXES.some((p) => host.startsWith(p))) {
    return { ok: false, error: 'That URL points to a private network.' };
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    return { ok: false, error: 'That URL points to a private network.' };
  }

  return { ok: true, url: `${parsed.protocol}//${parsed.host}` };
}

export function sanitizeDisplayName(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}
