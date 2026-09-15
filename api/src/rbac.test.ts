import assert from "node:assert/strict";
import test from "node:test";
import { canManageProject, canReadProject, canRunProduction, canUpload, canWriteChat, normalizeRole } from "./rbac.js";

test("only the approved five roles are accepted", () => {
  assert.deepEqual(["OWNER", "ADMIN", "MEMBER", "UPLOADER", "VIEWER"].map(normalizeRole), ["OWNER", "ADMIN", "MEMBER", "UPLOADER", "VIEWER"]);
  assert.equal(normalizeRole("editor"), "MEMBER");
  assert.equal(normalizeRole("unknown"), "VIEWER");
});
test("owner/admin manage projects and only owner can run production", () => {
  assert.equal(canManageProject("OWNER"), true); assert.equal(canManageProject("ADMIN"), true); assert.equal(canManageProject("MEMBER"), false);
  assert.equal(canRunProduction("OWNER"), true); assert.equal(canRunProduction("ADMIN"), false);
});
test("viewer cannot write or upload", () => {
  assert.equal(canReadProject("VIEWER"), true); assert.equal(canWriteChat("VIEWER"), false); assert.equal(canUpload("VIEWER"), false); assert.equal(canUpload("UPLOADER"), true);
});
