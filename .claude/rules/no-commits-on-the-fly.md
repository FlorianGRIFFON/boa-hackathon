---
description: When using subagents or parallel agents, do not commit changes on the fly. Stage all changes and create one consolidated commit at the end.
alwaysApply: true
---

# No Commits on the Fly

When dispatching subagents or parallel agents for implementation work:

- **Do NOT** instruct subagents to commit their changes
- **Do NOT** commit after each task or subagent completes
- **Stage** all changes as they are made
- **Create one consolidated commit** at the end when all work is complete and verified

## Why

- Keeps git history clean with logical, reviewable commits
- Easier to review the full scope of changes together before they land

## Instructions for Subagent Prompts

When writing prompts for implementer subagents, replace instructions like:
- "Commit with message X"
- "Commit your work"

With:
- "Do not commit. Report back when done. Changes will be committed together when all tasks are complete."
