#!/bin/sh
# Runs inside the delegate container, started by run.sh: tasks file → implement step → review step → pull request.
# Secrets live only in non-exported shell variables; Claude sessions never receive GH_TOKEN.

set -eu

readonly WORKSPACE="/workspace"
readonly MAIN_BRANCH="main"
readonly TASKS_FILE_IN_REPOSITORY="TASKS.md"
readonly CODING_STANDARDS_FILE="CODING_STANDARDS.md"
readonly LARGE_MODEL="opus"
readonly SMALL_MODEL="sonnet"
readonly PULL_REQUEST_DIRECTORY="$(mktemp -d)"
readonly PULL_REQUEST_TITLE_FILE="$PULL_REQUEST_DIRECTORY/title.txt"
readonly PULL_REQUEST_BODY_FILE="$PULL_REQUEST_DIRECTORY/body.md"

current_step="setup"

read_secret() {
  sed -n "s/^$1=//p" "$SECRETS_FILE" | tail -n 1 | tr -d '\r'
}

github_token="$(read_secret GH_TOKEN)"
claude_token="$(read_secret CLAUDE_CODE_OAUTH_TOKEN)"
rm -f "$SECRETS_FILE"
readonly github_token claude_token

fail() {
  echo "delegate: $*" >&2
  exit 1
}

report_failed_step() {
  exit_status=$?
  if [ "$exit_status" -ne 0 ]; then
    echo "delegate: run failed during step: $current_step" >&2
  fi
}

start_step() {
  current_step="$1"
  echo "==> $current_step"
}

git_with_github_token() {
  # https://git-scm.com/docs/gitcredentials#_custom_helpers
  GH_TOKEN="$github_token" git \
    -c credential.helper= \
    -c 'credential.helper=!f() { test "$1" = get && printf "username=x-access-token\npassword=%s\n" "$GH_TOKEN"; }; f' \
    "$@"
}

gh_with_github_token() {
  GH_TOKEN="$github_token" gh "$@"
}

run_claude_session() {
  model="$1"
  shift
  env -u GH_TOKEN \
    CLAUDE_CODE_OAUTH_TOKEN="$claude_token" \
    CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1 \
    claude --print --model "$model" --dangerously-skip-permissions "$@"
}

remote_branch_exists() {
  git_with_github_token ls-remote --exit-code --heads "$REPOSITORY_URL" "$BRANCH" >/dev/null
}

clone_repository() {
  sudo mkdir -p "$WORKSPACE"
  sudo chown "$(id -un):$(id -gn)" "$WORKSPACE"
  git_with_github_token clone --branch "$MAIN_BRANCH" "$REPOSITORY_URL" "$WORKSPACE"
  cd "$WORKSPACE"
  git config --global user.name "$GIT_USER_NAME"
  git config --global user.email "$GIT_USER_EMAIL"
}

install_dependencies() {
  bash .devcontainer/scripts/post-create.sh
}

push_branch() {
  git_with_github_token push --quiet --set-upstream origin "$BRANCH"
}

require_clean_working_tree() {
  [ -z "$(git status --porcelain)" ] || fail "the session left uncommitted changes"
}

require_all_tasks_done() {
  if grep -Eq '^## \[ \]' "$TASKS_FILE_IN_REPOSITORY"; then
    fail "not every task in $TASKS_FILE_IN_REPOSITORY is ticked"
  fi
}

verify_every_commit_since() {
  base_commit="$1"
  installed_commit="$(git rev-parse HEAD)"
  for commit in $(git rev-list --reverse "$base_commit..HEAD"); do
    echo "--> verify $(git log -1 --format='%h %s' "$commit")"
    git checkout --quiet "$commit"
    if ! git diff --quiet "$installed_commit" "$commit" -- package-lock.json; then
      npm ci
      installed_commit="$commit"
    fi
    if ! npm run verify; then
      git checkout --quiet "$BRANCH"
      fail "npm run verify fails on commit $commit"
    fi
  done
  git checkout --quiet "$BRANCH"
}

finish_session_step() {
  step_base_commit="$1"
  push_branch
  require_clean_working_tree
  verify_every_commit_since "$step_base_commit"
}

commit_tasks_file() {
  git switch --create "$BRANCH"
  cp "$TASKS_FILE" "$TASKS_FILE_IN_REPOSITORY"
  git add "$TASKS_FILE_IN_REPOSITORY"
  git commit --quiet --message "chore: Add tasks"
  push_branch
}

implement_tasks() {
  step_base_commit="$(git rev-parse HEAD)"
  run_claude_session "$SMALL_MODEL" "Implement the tasks in $TASKS_FILE_IN_REPOSITORY, one after another in their numbered order.

For each task:
1. Make the change the task describes, meeting all its acceptance criteria.
2. Run \`npm run verify\` and fix the code until it passes.
3. Tick the task's heading checkbox in $TASKS_FILE_IN_REPOSITORY (\`## [ ]\` becomes \`## [x]\`).
4. Commit everything as exactly one Conventional Commit with a capitalized summary.

Never push. Never change other tasks in $TASKS_FILE_IN_REPOSITORY. Finish with a clean working tree."
  finish_session_step "$step_base_commit"
  require_all_tasks_done
}

review_changes() {
  step_base_commit="$(git rev-parse HEAD)"
  run_claude_session "$LARGE_MODEL" \
    --append-system-prompt-file "$CODING_STANDARDS_FILE" \
    "Review the changes on this branch against origin/$MAIN_BRANCH (\`git log origin/$MAIN_BRANCH..HEAD\`, \`git diff origin/$MAIN_BRANCH...HEAD\`).

$TASKS_FILE_IN_REPOSITORY describes what the changes must achieve. Check that every task is fully and correctly implemented, and that the changes follow the coding standards in your system prompt.

Fix every problem you find directly. Commit each improvement as one focused Conventional Commit with a capitalized summary, and make sure \`npm run verify\` passes after each commit. Do not change $TASKS_FILE_IN_REPOSITORY. Never push. Finish with a clean working tree."
  finish_session_step "$step_base_commit"
}

remove_tasks_file() {
  git rm --quiet "$TASKS_FILE_IN_REPOSITORY"
  git commit --quiet --message "chore: Remove tasks"
  push_branch
}

write_pull_request() {
  run_claude_session "$LARGE_MODEL" "Write the pull request for branch $BRANCH into $MAIN_BRANCH.

The changes implement this tasks file:

<tasks-file>
$(cat "$TASKS_FILE")
</tasks-file>

Inspect the changes with \`git log origin/$MAIN_BRANCH..HEAD\` and \`git diff origin/$MAIN_BRANCH...HEAD\`. Then:
- Write the title as a Conventional Commit summary with a capitalized subject to $PULL_REQUEST_TITLE_FILE.
- Write the body using the pr skill to $PULL_REQUEST_BODY_FILE, ending with the line: 🤖 Generated with [Claude Code](https://claude.com/claude-code)

Do not change any file in the repository, do not commit, do not push and do not run gh."
  [ -s "$PULL_REQUEST_TITLE_FILE" ] || fail "the session wrote no pull request title"
  [ -s "$PULL_REQUEST_BODY_FILE" ] || fail "the session wrote no pull request body"
}

create_pull_request() {
  gh_with_github_token pr create \
    --base "$MAIN_BRANCH" \
    --head "$BRANCH" \
    --title "$(head -n 1 "$PULL_REQUEST_TITLE_FILE")" \
    --body-file "$PULL_REQUEST_BODY_FILE"
}

trap report_failed_step EXIT

if remote_branch_exists; then
  fail "branch $BRANCH already exists on the remote"
fi

start_step "clone repository"
clone_repository
start_step "install dependencies"
install_dependencies
start_step "commit tasks file"
commit_tasks_file
start_step "implement step"
implement_tasks
start_step "review step"
review_changes
start_step "remove tasks file"
remove_tasks_file
start_step "write pull request"
write_pull_request
start_step "create pull request"
create_pull_request
echo "delegate: done"
