/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the Express API.
   *
   * Must be an absolute URL in production: the app is served from Vercel while
   * the API runs elsewhere, so the default `/api` would resolve to the Vercel
   * deployment itself and every request would 404.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
