/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOSTING_STATUS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
