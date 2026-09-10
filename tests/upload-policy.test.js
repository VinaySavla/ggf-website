import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUploadFolder, resolveStoragePath, sanitizeFilename, validateFileContents } from "../lib/upload-policy.js";
import { sanitizeRichText } from "../lib/sanitize.js";
import { mergeSportStats } from "../lib/member-profile.js";
import { optionalHttpUrl } from "../lib/validation.js";

test("upload folders reject traversal and unknown roots", () => {
  assert.throws(() => normalizeUploadFolder("../outside"));
  assert.throws(() => normalizeUploadFolder("unknown/files"));
  assert.equal(normalizeUploadFolder("gallery/event-one").folder, "gallery/event-one");
});

test("resolved storage paths cannot escape private storage", () => {
  assert.throws(() => resolveStoragePath("../../secret.txt"));
  assert.match(resolveStoragePath("profiles/photo.jpg"), /storage[\\/]profiles[\\/]photo\.jpg$/);
});

test("filenames cannot preserve path segments", () => {
  assert.equal(sanitizeFilename("../../unsafe name.png"), "unsafe_name.png");
});

test("file signatures must match claimed content type", () => {
  const policy = normalizeUploadFolder("profiles").policy;
  assert.equal(validateFileContents(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg", policy).extension, ".jpg");
  assert.throws(() => validateFileContents(Buffer.from("<svg onload=alert(1) />"), "image/jpeg", policy));
});

test("rich text sanitizer removes scripts and unsafe links", () => {
  const clean = sanitizeRichText('<p onclick="alert(1)">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src=x onerror=alert(1)>');
  assert.equal(clean.includes("<script"), false);
  assert.equal(clean.includes("javascript:"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("onerror"), false);
});

test("external links accept only http and https", () => {
  assert.match(optionalHttpUrl("https://example.org/apply"), /^https:\/\/example\.org/);
  assert.throws(() => optionalHttpUrl("javascript:alert(1)"));
});

test("sport totals merge while retaining event records", () => {
  const result = mergeSportStats([{ id: "one", sport: { id: "cricket", name: "Cricket" }, statsJson: { runs: 10 }, label: "Match 1" }, { id: "two", sport: { id: "cricket", name: "Cricket" }, statsJson: { runs: 15, wickets: 2 }, label: "Match 2" }]);
  assert.deepEqual(result[0].totals, { runs: 25, wickets: 2 });
  assert.equal(result[0].events.length, 2);
});
