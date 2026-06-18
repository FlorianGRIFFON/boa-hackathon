---
description: Never stage or commit changes unless the user explicitly asks. Just edit files and stop.
alwaysApply: true
---

# No Staging or Committing Without Explicit Request

**Never run `git add` or `git commit` unless the user explicitly asks.**

Just edit files. The user decides when to stage and commit.

## When dispatching subagents

Subagent prompts must say: "Do not stage or commit. Report back when done."

## Commit format (when the user does ask)

- Use git conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- One concise sentence after the type
- No `Co-Authored-By:` trailer — ever

## Why

The user wants full control over the working tree and git history. Autonomous staging is surprising — it changes `git status` output and can lump unrelated changes together.
