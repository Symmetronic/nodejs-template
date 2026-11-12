import packageJson from "#/package.json" with { type: "json" };
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const license = readFileSync(new URL("../../../LICENSE", import.meta.url), {
  encoding: "utf8",
});

const COPYRIGHT = /^Copyright \(c\) (?<year>\d{4}) (?<holder>.+)$/mu;

const AUTHOR_NAME = /^(?<name>[^<(]+?)\s*(?:[<(]|$)/u;

function parseCopyright(): Readonly<{ year: string; holder: string }> {
  const groups = COPYRIGHT.exec(license)?.groups;
  assert.ok(groups?.["year"], "LICENSE must contain a copyright year");
  assert.ok(groups["holder"], "LICENSE must contain a copyright holder");
  return { year: groups["year"], holder: groups["holder"] };
}

describe("LICENSE", () => {
  it("matches the license in package.json", () => {
    const [title] = license.split("\n");

    assert.equal(title, `${packageJson.license} License`);
  });

  it("has the current year in the copyright", () => {
    assert.equal(parseCopyright().year, String(new Date().getFullYear()));
  });

  it("names the author from package.json as copyright holder", () => {
    const authorName = AUTHOR_NAME.exec(packageJson.author)?.groups?.["name"];

    assert.equal(parseCopyright().holder, authorName);
  });
});
