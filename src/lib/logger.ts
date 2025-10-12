type LogLevel = "info" | "warn" | "error";

const PREFIX = "[time-capsule]";

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const payload = metadata ? { scope, message, ...metadata } : { scope, message };
  const line = `${PREFIX}[${scope}] ${message}`;

  switch (level) {
    case "info":
      console.log(line, metadata ?? "");
      break;
    case "warn":
      console.warn(line, metadata ?? "");
      break;
    case "error":
      console.error(line, metadata ?? "");
      break;
  }
  return payload;
}

export function logInfo(
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return emit("info", scope, message, metadata);
}

export function logWarn(
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return emit("warn", scope, message, metadata);
}

export function logError(
  scope: string,
  errorId: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  const payload = {
    errorId,
    error:
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : String(error),
    ...(metadata ?? {}),
  };
  emit("error", scope, `error ${errorId}`, payload);
  return payload;
}

export function createErrorId(scope: string, code: string) {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2);
  const short = uuid.split("-")[0];
  return `${scope}-${code}-${short}`.toUpperCase();
}
