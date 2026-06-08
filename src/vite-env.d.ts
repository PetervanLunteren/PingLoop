/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed push backend (Cloudflare Worker). Optional. */
  readonly VITE_PUSH_API?: string;
  /** VAPID public key matching the backend. Optional. */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
