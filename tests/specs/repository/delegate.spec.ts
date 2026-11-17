import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const RUN_SCRIPT = fileURLToPath(
  new URL("../../../.claude/skills/delegate/scripts/run.sh", import.meta.url),
);

const SKILL_DIRECTORY = join(".claude", "skills", "delegate");
const BRANCH = "feat/example";
const BOTH_TOKENS = "CLAUDE_CODE_OAUTH_TOKEN=claude\nGH_TOKEN=github\n";

type Fixture = Readonly<{
  tasksFile: boolean;
  secrets: string | undefined;
}>;

function runDelegateRun(
  branch: string,
  { tasksFile, secrets }: Fixture,
): SpawnSyncReturns<string> {
  const repository = mkdtempSync(join(tmpdir(), "delegate-"));
  const skillDirectory = join(repository, SKILL_DIRECTORY);
  const runDirectory = join(skillDirectory, "runs", branch);

  try {
    spawnSync("git", ["init", "--quiet", repository]);
    mkdirSync(join(skillDirectory, "scripts"), { recursive: true });
    copyFileSync(RUN_SCRIPT, join(skillDirectory, "scripts", "run.sh"));
    mkdirSync(runDirectory, { recursive: true });
    if (tasksFile) {
      writeFileSync(join(runDirectory, "TASKS.md"), "# Goal\n");
    }
    if (secrets !== undefined) {
      writeFileSync(join(repository, ".env"), secrets);
    }

    return spawnSync(
      "sh",
      [join(skillDirectory, "scripts", "run.sh"), branch],
      { encoding: "utf8" },
    );
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
}

function assertRefusesWith(
  result: SpawnSyncReturns<string>,
  reason: RegExp,
): void {
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, reason);
}

describe("delegate", () => {
  it("run.sh refuses to start without a branch", () => {
    assertRefusesWith(
      runDelegateRun("", { tasksFile: true, secrets: BOTH_TOKENS }),
      /usage: run\.sh <branch>/u,
    );
  });

  it("run.sh refuses to start without a tasks file for the branch", () => {
    assertRefusesWith(
      runDelegateRun(BRANCH, { tasksFile: false, secrets: BOTH_TOKENS }),
      /missing tasks file/u,
    );
  });

  for (const token of ["CLAUDE_CODE_OAUTH_TOKEN", "GH_TOKEN"] as const) {
    it(`run.sh refuses to start without ${token} in .env, so that a delegate run never fails halfway for lack of a token`, () => {
      const secrets = BOTH_TOKENS.replace(
        new RegExp(`^${token}=.*$`, "mu"),
        `${token}=`,
      );

      assertRefusesWith(
        runDelegateRun(BRANCH, { tasksFile: true, secrets }),
        new RegExp(`must define a non-empty ${token}`, "u"),
      );
    });
  }

  it("run.sh refuses to start without a .env file", () => {
    assertRefusesWith(
      runDelegateRun(BRANCH, { tasksFile: true, secrets: undefined }),
      /must define a non-empty CLAUDE_CODE_OAUTH_TOKEN/u,
    );
  });
});
