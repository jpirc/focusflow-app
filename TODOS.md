# TODOS.md

Technical debt and deferred features, tracked for future implementation.

---

## Seamless Capture - Deferred Items

### P2: Whisper API fallback for Firefox

**What:** Add server-side transcription via Whisper API for browsers without Web Speech API support.

**Why:** ~15% of users (Firefox) currently get no voice capture at all. The mic button is hidden entirely on unsupported browsers.

**Pros:**
- Full browser coverage for voice capture
- Better transcription accuracy than Web Speech API
- Works offline if using local Whisper model

**Cons:**
- OpenAI API costs (~$0.006/minute of audio)
- Server-side audio processing adds latency
- Requires new `/api/capture/transcribe` route
- Need to handle audio recording and upload on client

**Context:**
Current implementation uses Web Speech API which is free and browser-native, but only supported in Chrome, Edge, and Safari (with webkit prefix). Firefox users see no mic button at all.

The proposed solution would:
1. Detect unsupported browsers
2. Show mic button that records audio client-side (MediaRecorder API)
3. Upload audio to new `/api/capture/transcribe` endpoint
4. Server calls Whisper API and returns transcript
5. Transcript flows into same capture pipeline

**Effort:** M (1-2 days)

**Depends on:** Validate voice capture usage from Chrome/Edge/Safari users first. If voice adoption is low, this may not be worth the cost.

**Blocked by:** Nothing technical.

---

### P2: Share handler API tests

**What:** Add Jest/Vitest tests for `/api/capture/share` route.

**Why:** Engineering review identified this as a gap. The route handles external input and should be tested.

**Test cases needed:**
- Returns 401 when not authenticated
- Returns 400 when no content provided
- Returns 400 for empty text/url/title
- Truncates content over 10KB
- Combines title + text + url correctly
- Doesn't duplicate URL if already in text

**Context:**
The project doesn't have a test infrastructure set up yet. Need to:
1. Install Jest or Vitest
2. Configure for Next.js App Router
3. Add mock utilities for NextAuth session
4. Write the tests

**Effort:** M (setting up test infra) or S (if infra exists)

**Depends on:** Test infrastructure setup.

---

### P3: Browser extension for web capture

**What:** Chrome/Firefox extension to capture content from any webpage.

**Why:** Currently share sheets only work from mobile. A browser extension would enable desktop quick capture without switching to the app.

**Context:**
Would need separate extension codebase, authentication flow, and API integration.

**Effort:** L (2-3 days for MVP)

**Depends on:** Core capture flow stabilization.

---

### P3: Slack/Discord integration

**What:** Slack slash command or bot that creates tasks from messages.

**Why:** Many users live in Slack. "Remind me about this" workflow.

**Context:**
Requires:
- Slack App setup
- Webhook handler
- OAuth flow for user linking
- Message parsing (potentially use same AI parser)

**Effort:** L

**Depends on:** Nothing, but lower priority than core UX.

---

## Architecture Debt

### P2: Split app/page.tsx orchestration

**What:** The main `app/page.tsx` is ~1750 lines. Should be split into domain containers.

**Why:** High coupling increases regression risk and makes the file hard to navigate.

**Proposed structure:**
- `app/page.tsx` - minimal shell, composes containers
- `containers/TaskOrchestration.tsx` - task state, CRUD, drag-drop
- `containers/TimelineOrchestration.tsx` - timeline/inbox views
- `containers/PomodoroOrchestration.tsx` - timer, sessions
- `containers/ModalOrchestration.tsx` - all modal state

**Context:**
This is documented in MASTER_ARCHITECTURE_ROADMAP.md as P1 priority. Deferred due to scope.

**Effort:** L (1-2 days of careful refactoring)

**Depends on:** Good test coverage to catch regressions.

---

## Notes

- Items are prefixed with priority: P0 (critical), P1 (next), P2 (soon), P3 (later)
- Effort: S (< 2 hours), M (half day), L (1-2 days), XL (week+)
- Update this file when completing or deferring work
- See `docs/MASTER_ARCHITECTURE_ROADMAP.md` for broader roadmap context
