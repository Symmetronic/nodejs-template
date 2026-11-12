import assert from "node:assert/strict";

export function assertIsObject(
  value: unknown,
  message: string,
): asserts value is Readonly<Record<string, unknown>> {
  assert.ok(typeof value === "object" && value !== null, message);
}

export function assertIsString(
  value: unknown,
  message: string,
): asserts value is string {
  assert.equal(typeof value, "string", message);
}

export function assertIsNumber(
  value: unknown,
  message: string,
): asserts value is number {
  assert.equal(typeof value, "number", message);
}
