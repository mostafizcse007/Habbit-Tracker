import test from "node:test"
import assert from "node:assert/strict"

// Mirrored from src/lib/logger.ts
const SENSITIVE_KEY_PATTERN =
  /password|token|secret|api_?key|auth|bearer|cookie|credential|credit_?card/i

function redact(obj, depth = 0) {
  if (depth > 5) return "[DEPTH_EXCEEDED]"
  if (obj === null || obj === undefined) return obj

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
    }
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1))
  }

  if (typeof obj === "object") {
    const clean = {}
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

test("logger redact: redacts password, secret, token, and api keys at root level", () => {
  const payload = {
    user: "alice",
    password: "SuperSecretPassword123!",
    api_key: "ai-secret-xyz",
    accessToken: "jwt-token-abc",
  }
  const clean = redact(payload)
  assert.equal(clean.user, "alice")
  assert.equal(clean.password, "[REDACTED]")
  assert.equal(clean.api_key, "[REDACTED]")
  assert.equal(clean.accessToken, "[REDACTED]")
})

test("logger redact: recursively redacts nested credentials inside headers and configs", () => {
  const payload = {
    endpoint: "/api/chat",
    headers: {
      authorization: "Bearer eyJhbGci...",
      cookie: "sb-auth-token=secret123",
      "x-service-secret": "master-key",
      "content-type": "application/json",
    },
  }
  const clean = redact(payload)
  assert.equal(clean.headers.authorization, "[REDACTED]")
  assert.equal(clean.headers.cookie, "[REDACTED]")
  assert.equal(clean.headers["x-service-secret"], "[REDACTED]")
  assert.equal(clean.headers["content-type"], "application/json")
})

test("logger redact: handles arrays of objects without mutating non-sensitive data", () => {
  const payload = [
    { id: 1, title: "Clean Habit" },
    { id: 2, secretToken: "dont-log-this" },
  ]
  const clean = redact(payload)
  assert.equal(clean[0].title, "Clean Habit")
  assert.equal(clean[1].secretToken, "[REDACTED]")
})
