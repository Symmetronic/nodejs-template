---
name: to-tasks
description: Break a plan, spec, or the current conversation into a tasks file (`TASKS.md`) of tracer-bullet tasks, each one commit that keeps `npm run verify` green, in dependency order.
disable-model-invocation: true
---

# To Tasks

Break a plan, spec, or conversation into a **tasks file**: a single `TASKS.md` listing **tasks**, each a tracer-bullet vertical slice that lands as exactly one commit, ordered so every task's blockers come before it.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Task titles and descriptions should use the project's domain vocabulary.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tasks.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- Each task is exactly one commit, and `npm run verify` passes after that commit: no task may leave the repository red, not even temporarily
- A completed slice is demoable or verifiable on its own
- Any prefactoring comes first, as its own task

</vertical-slice-rules>

Give each task its **blocking edges**: the other tasks that must complete before it can start. Number the tasks in dependency order, so every task's blockers have lower numbers.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks many call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per module, per directory), each batch its own task blocked by the expand, keeping verification green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a task blocked by every migrate batch.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each task, show:

- **Title**: short descriptive name
- **Blocked by**: which other tasks (if any) must complete first
- **Delivers**: the end-to-end behaviour this task makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each task only depend on tasks that genuinely gate it?
- Can every task land as one commit with verification green?
- Should any tasks be merged or split further?

Iterate until the user approves the breakdown.

### 5. Write the tasks file

Write the approved tasks to a single `TASKS.md`, at the path you were given, or at the repository root otherwise. Use the template below. A task is done when its heading checkbox is ticked (`## [x] …`); whoever completes a task ticks it in the same commit.

<tasks-file-template>

# <Goal>

<2–5 sentences of context: why this change, and the decisions that shape it>

## [ ] 1. <Task title>

**Blocked by:** None

**Delivers:** <the end-to-end behaviour this task makes work, from the user's perspective, not a layer-by-layer implementation list>

- <acceptance criterion>
- <acceptance criterion>

## [ ] 2. <Task title>

**Blocked by:** 1

**Delivers:** <…>

- <acceptance criterion>

</tasks-file-template>

Avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts.
