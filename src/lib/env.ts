const SUPABASE_ENV = {
  public: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const,
  server: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE"] as const,
} as const;

const GEMINI_ENV = ["GEMINI_API_KEY", "GEMINI_MODEL"] as const;

type RequiredEnvKey =
  | (typeof SUPABASE_ENV.public)[number]
  | (typeof SUPABASE_ENV.server)[number]
  | (typeof GEMINI_ENV)[number];

function missingEnv(keys: readonly RequiredEnvKey[]) {
  return keys.filter((key) => !process.env[key]);
}

export function assertServerEnv() {
  const missing = missingEnv(SUPABASE_ENV.server);

  if (missing.length) {
    throw new Error(
      `[time-capsule][env] Missing required server environment variables: ${missing.join(
        ", ",
      )}`,
    );
  }
}

export function assertGeminiEnv() {
  const missing = missingEnv(GEMINI_ENV);

  if (missing.length) {
    throw new Error(
      `[time-capsule][env] Missing required Gemini environment variables: ${missing.join(
        ", ",
      )}`,
    );
  }
}

export function isSupabaseConfigured() {
  const missing = missingEnv(SUPABASE_ENV.public);
  return missing.length === 0;
}

export function getEnv(name: RequiredEnvKey) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[time-capsule][env] Missing environment variable ${name}`);
  }
  return value;
}
