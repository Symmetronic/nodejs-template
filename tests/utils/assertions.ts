import assert from "node:assert/strict";

export const assertNonEmptyString = (value: unknown, field: string): void => {
  assert.equal(typeof value, "string", `${field} must be a string`);
  assert.notEqual(value, "", `${field} must not be empty`);
};
