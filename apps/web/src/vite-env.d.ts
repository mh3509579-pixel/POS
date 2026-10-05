/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional absolute origin of the Express API.
   *
   * The Vercel rewrite in apps/web/vercel.json already proxies `/api/*` to the
   * deployed API, so the default relative `/api` works on Vercel. This override
   * exists only for pointing the client at a different API host without a code
   * change.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
