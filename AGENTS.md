# Codex Session Rules

These rules apply to every future Codex session in this workspace.

## 1) Session Handoff Is Required
- Before ending a work session, always update `/Users/jonathanpirc/Desktop/Apps/focusflow-app/SESSION_TRANSITION.md`.
- Add a new entry at the top (newest first). Do not delete previous entries.
- Keep entries concise and actionable.

## 2) Required Handoff Sections
Each new handoff entry must include:
- Date/time
- What was done
- Why these changes were made
- Files changed
- Validation run (lint/typecheck/build/tests)
- Open issues / risks
- Next recommended steps
- Git state (branch + latest commit hash if created)

## 3) Startup Behavior
- At the beginning of each new session, read the latest entry in `/Users/jonathanpirc/Desktop/Apps/focusflow-app/SESSION_TRANSITION.md` and use it to re-establish context before making changes.

## 4) Style
- Prefer practical details over long narrative.
- Include exact file paths when referencing code.
