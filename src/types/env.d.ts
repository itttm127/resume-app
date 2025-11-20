interface ImportMetaEnv {
  readonly VITE_OPENAI_KEY?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

