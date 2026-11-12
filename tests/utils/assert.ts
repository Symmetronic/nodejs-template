import assert from "node:assert/strict";

export function assertIsObject(
  value: unknown,
  message: string,
): asserts value is object {
  assert.ok(typeof value === "object" && value !== null, message);
}

export function assertIsString(
  value: unknown,
  message: string,
): asserts value is string {
  assert.equal(typeof value, "string", message);
}
