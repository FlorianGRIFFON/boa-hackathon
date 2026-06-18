---
description: Never commit changes unless the user explicitly asks. Stage all changes; wait for a commit instruction.
alwaysApply: true
---

# No Commits Without Explicit Request

**Never run `git commit` unless the user explicitly asks for a commit.**

This applies always — not just during subagent work.

- **Stage** changes as work progresses (`git add`)
- **Do NOT commit** at the end of a task, even if the work feels complete
- **Wait** for the user to say "commit" or equivalent before committing

## When dispatching subagents

- Do NOT instruct subagents to commit their changes
- Subagent prompts must say: "Do not commit. Report back when done."

## Commit format (when the user does ask)

- Use git conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- One concise sentence after the type
- No `Co-Authored-By:` trailer — ever

## Why

The user wants full control over what lands in git history and when. Autonomous commits are surprising and hard to undo cleanly.
