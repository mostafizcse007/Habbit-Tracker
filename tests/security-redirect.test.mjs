import test from "node:test"
import assert from "node:assert/strict"

// Mirrored from src/app/auth/callback/route.ts
function getSafeRedirectPath(rawNext) {
  if (!rawNext || typeof rawNext !== "string") {
    return "/dashboard"
  }

  const trimmed = rawNext.trim()

  // Must start with a single slash, not protocol-relative '//', and not backslash '/\'
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return "/dashboard"
  }

  // Prevent CRLF / header injection
  if (/[\r\n\0]/.test(trimmed)) {
    return "/dashboard"
  }

  return trimmed
}

test("getSafeRedirectPath: allows valid internal relative paths", () => {
  assert.equal(getSafeRedirectPath("/dashboard"), "/dashboard")
  assert.equal(getSafeRedirectPath("/habits"), "/habits")
  assert.equal(getSafeRedirectPath("/analytics?tab=trends"), "/analytics?tab=trends")
  assert.equal(getSafeRedirectPath("/profile#security"), "/profile#security")
})

test("getSafeRedirectPath: falls back to /dashboard on null, undefined, or empty values", () => {
  assert.equal(getSafeRedirectPath(null), "/dashboard")
  assert.equal(getSafeRedirectPath(undefined), "/dashboard")
  assert.equal(getSafeRedirectPath(""), "/dashboard")
  assert.equal(getSafeRedirectPath("   "), "/dashboard")
})

test("getSafeRedirectPath: rejects external URLs and protocol relative URLs (Open Redirect Defenses)", () => {
  // Protocol relative
  assert.equal(getSafeRedirectPath("//evil.com"), "/dashboard")
  assert.equal(getSafeRedirectPath("//evil.com/phishing"), "/dashboard")
  assert.equal(getSafeRedirectPath("///evil.com"), "/dashboard")

  // External schemas
  assert.equal(getSafeRedirectPath("https://attacker.com"), "/dashboard")
  assert.equal(getSafeRedirectPath("http://attacker.com"), "/dashboard")
  assert.equal(getSafeRedirectPath("javascript:alert(1)"), "/dashboard")
  assert.equal(getSafeRedirectPath("data:text/html,evil"), "/dashboard")

  // Backslash and UNC path tricks
  assert.equal(getSafeRedirectPath("/\\attacker.com"), "/dashboard")
  assert.equal(getSafeRedirectPath("\\\\attacker.com"), "/dashboard")
})

test("getSafeRedirectPath: rejects CRLF injection and null byte attempts", () => {
  assert.equal(getSafeRedirectPath("/dashboard\r\nSet-Cookie:admin=1"), "/dashboard")
  assert.equal(getSafeRedirectPath("/dashboard\nLocation:http://evil.com"), "/dashboard")
  assert.equal(getSafeRedirectPath("/dashboard\0evil"), "/dashboard")
})
