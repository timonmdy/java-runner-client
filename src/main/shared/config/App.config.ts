/**
 * Single source of truth for Content-Security-Policy origins.
 * The Vite build reads this to inject the CSP meta tag into index.html.
 *
 * To allow a new external resource, add it here — no other file needs updating.
 */
export const ALLOWED_ORIGINS = {
  /** Image sources (CSP img-src) */
  img: ['https://flagcdn.com', 'https://avatars.githubusercontent.com'],

  /** Stylesheet sources (CSP style-src) */
  style: ['https://fonts.googleapis.com'],

  /** Font file sources (CSP font-src) */
  font: ['https://fonts.gstatic.com'],

  /** Network requests (CSP connect-src) */
  connect: ['http://127.0.0.1:*', 'http://localhost:*', 'https://fonts.googleapis.com'],
} as const;

/** Builds the full CSP string from ALLOWED_ORIGINS. */
export function buildCSP(): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline' ${ALLOWED_ORIGINS.style.join(' ')}`,
    `img-src 'self' data: ${ALLOWED_ORIGINS.img.join(' ')}`,
    `font-src 'self' ${ALLOWED_ORIGINS.font.join(' ')}`,
    `connect-src 'self' ${ALLOWED_ORIGINS.connect.join(' ')}`,
  ];
  return directives.join('; ');
}
