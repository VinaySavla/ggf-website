import assert from "node:assert/strict";
import test from "node:test";
import { authSecret } from "../lib/secrets.js";

test("legacy NEXTAUTH_SECRET remains valid", () => {
  const originalAuth = process.env.AUTH_SECRET;
  const originalNextAuth = process.env.NEXTAUTH_SECRET;
  delete process.env.AUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "x".repeat(32);
  try {
    assert.equal(authSecret(), "x".repeat(32));
  } finally {
    if (originalAuth === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalAuth;
    if (originalNextAuth === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalNextAuth;
  }
});
