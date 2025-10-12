const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
] as const;

type RequiredEnvKey = (typeof REQUIRED_SERVER_ENV)[number];

function missingEnv(keys: RequiredEnvKey[]) {
  return keys.filter((key) => !process.env[key]);
}

export function assertServerEnv() {
  const missing = missingEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE",
  ]);

  if (missing.length) {
    throw new Error(
      `[time-capsule][env] Missing required server environment variables: ${missing.join(
        ", ",
      )}`,
    );
  }
}

export function assertGeminiEnv() {
  const missing = missingEnv(["GEMINI_API_KEY", "GEMINI_MODEL"]);

  if (missing.length) {
    throw new Error(
      `[time-capsule][env] Missing required Gemini environment variables: ${missing.join(
        ", ",
      )}`,
    );
  }
}

export function isSupabaseConfigured() {
  const missing = missingEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]);
  return missing.length === 0;
}

export function getEnv(name: RequiredEnvKey) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[time-capsule][env] Missing environment variable ${name}`);
  }
  return value;
}

