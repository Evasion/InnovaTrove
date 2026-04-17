// NG_APP_API_URL is injected at build time by Angular's build tooling.
// Set it in the Railway client service environment variables.
declare const process: { env: Record<string, string | undefined> };

export const environment = {
  production: true,
  apiUrl: process.env['NG_APP_API_URL'] ?? '/api',
};
