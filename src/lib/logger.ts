type LogLevel = "debug" | "info" | "warn" | "error"

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|api_?key|auth|bearer|cookie|credential|credit_?card/i

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[DEPTH_EXCEEDED]"
  if (obj === null || obj === undefined) return obj

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: process.env.NODE_ENV !== "production" ? obj.stack : undefined,
    }
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1))
  }

  if (typeof obj === "object") {
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        clean[k] = "[REDACTED]"
      } else {
        clean[k] = redact(v, depth + 1)
      }
    }
    return clean
  }

  return obj
}

function formatLog(
  level: LogLevel,
  context: string,
  message: string,
  meta?: unknown
): void {
  const timestamp = new Date().toISOString()
  const sanitizedMeta = meta !== undefined ? redact(meta) : undefined

  if (process.env.NODE_ENV === "production") {
    // Production: Single-line JSON suitable for log aggregators (Datadog, CloudWatch, Axiom, Vercel)
    const logPayload = {
      timestamp,
      level,
      context,
      message,
      ...(sanitizedMeta !== undefined ? { meta: sanitizedMeta } : {}),
    }
    const serialized = JSON.stringify(logPayload)

    if (level === "error") {
      console.error(serialized)
    } else if (level === "warn") {
      console.warn(serialized)
    } else {
      console.log(serialized)
    }
  } else {
    // Development: Human-friendly formatted output
    const prefix = `[${timestamp.slice(11, 19)}] [${level.toUpperCase()}] [${context}]`
    if (level === "error") {
      console.error(prefix, message, sanitizedMeta !== undefined ? sanitizedMeta : "")
    } else if (level === "warn") {
      console.warn(prefix, message, sanitizedMeta !== undefined ? sanitizedMeta : "")
    } else {
      console.log(prefix, message, sanitizedMeta !== undefined ? sanitizedMeta : "")
    }
  }
}

export const logger = {
  debug: (context: string, message: string, meta?: unknown) =>
    formatLog("debug", context, message, meta),
  info: (context: string, message: string, meta?: unknown) =>
    formatLog("info", context, message, meta),
  warn: (context: string, message: string, meta?: unknown) =>
    formatLog("warn", context, message, meta),
  error: (context: string, message: string, meta?: unknown) =>
    formatLog("error", context, message, meta),
}
